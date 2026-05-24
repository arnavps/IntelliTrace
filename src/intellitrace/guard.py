"""
Distributed Deduplication Guard.

Provides a high-efficiency double-processing shield using Redis cluster
Scalable Bloom Filters backed by exact sliding-TTL string keys.
"""

import asyncio
import logging
from typing import Any, Callable, Dict, Optional, TypeVar
import redis.asyncio as aioredis
from redis.exceptions import ConnectionError, TimeoutError, ResponseError

from intellitrace.exceptions import RedisConnectionException

# Type variable for returning generic function results inside execution wrapper
T = TypeVar("T")


class IngestionDeduplicationGuard:
    """
    Ingestion Deduplication Guard Layer.
    
    Implements a zero-trust dual-layer checking system combining the memory efficiency
    of a 10M-capacity Scalable Bloom Filter with the absolute mathematical precision of
    an exact sliding-TTL Redis string key mapping.
    """

    def __init__(
        self,
        redis_url: str = "redis://localhost:6379/0",
        filter_name: str = "cbs:txn:bloom",
        capacity: int = 10000000,
        error_rate: float = 0.0001,
        ttl_seconds: int = 3600,
        max_retries: int = 5,
        base_retry_delay: float = 0.1,
    ):
        """
        Initialize the Deduplication Guard.
        
        Args:
            redis_url (str): The Redis connection endpoint string.
            filter_name (str): The Redis key name of the persistent Bloom Filter.
            capacity (int): Initial capacity of the Scalable Bloom Filter (default 10,000,000).
            error_rate (float): Acceptable false-positive probability boundary (default 0.0001 / 99.99% accuracy).
            ttl_seconds (int): Sliding TTL duration in seconds for exact verification keys (default 1 hour).
            max_retries (int): Maximum exponential backoff connection retries before failing.
            base_retry_delay (float): Base wait duration in seconds before starting retries.
        """
        self.redis_url = redis_url
        self.filter_name = filter_name
        self.capacity = capacity
        self.error_rate = error_rate
        self.ttl_seconds = ttl_seconds
        self.max_retries = max_retries
        self.base_retry_delay = base_retry_delay
        
        self.logger = logging.getLogger("IntelliTrace.Guard")
        
        # Instantiate Connection Pool with a baseline maximum size of 100 connections
        self.pool = aioredis.ConnectionPool.from_url(
            self.redis_url,
            max_connections=100,
            decode_responses=True,
            socket_timeout=2.0,
            socket_connect_timeout=2.0
        )

    async def initialize(self) -> None:
        """
        Pre-reserve the Scalable Bloom Filter inside the Redis instance.
        
        Idempotent operation: swallows responses if the filter key is already reserved/busy.
        """
        async def _reserve_cmd(client: aioredis.Redis) -> None:
            try:
                # Command syntax: BF.RESERVE key error_rate capacity
                await client.execute_command(
                    "BF.RESERVE", 
                    self.filter_name, 
                    str(self.error_rate), 
                    str(self.capacity)
                )
                self.logger.info(
                    f"Scalable Bloom Filter '{self.filter_name}' successfully pre-reserved "
                    f"(Capacity: {self.capacity:,}, Error Rate: {self.error_rate})."
                )
            except ResponseError as e:
                # Catch "item already exists" errors commonly raised when restarting pods
                msg = str(e).lower()
                if "item already exists" in msg or "busykey" in msg:
                    self.logger.info(f"Bloom Filter '{self.filter_name}' already initialized. Skipping reservation.")
                else:
                    raise

        await self._execute_with_retry(_reserve_cmd)

    async def is_duplicate_or_record(self, txn_id: str) -> bool:
        """
        Perform a high-efficiency double-processing checking and setting operation.
        
        Uses a dual-layer check:
        1. Checks Bloom Filter. If missing, it's absolutely a new transaction. Registers it and returns False.
        2. If Bloom Filter hits, performs an exact string exists check in Redis to eliminate false positives.
        
        Args:
            txn_id (str): The unique transaction ID (e.g. UUIDv4).
            
        Returns:
            bool: True if the transaction is a verified duplicate, False if novel.
        """
        exact_key = f"cbs:txn:exact:{txn_id}"

        async def _check_and_set_logic(client: aioredis.Redis) -> bool:
            # Step 1: Check Bloom Filter existence
            # Command: BF.EXISTS filter_key item
            exists_in_filter = await client.execute_command("BF.EXISTS", self.filter_name, txn_id)
            
            if exists_in_filter == 0:
                # NO: Absolutely a new entry! Add to filter and set exact key pipeline-wise
                async with client.pipeline(transaction=True) as pipe:
                    pipe.execute_command("BF.ADD", self.filter_name, txn_id)
                    pipe.set(exact_key, "1", ex=self.ttl_seconds)
                    await pipe.execute()
                return False

            # YES: The Bloom Filter flagged it as a tentative duplicate.
            # Step 2: Query exact string match to resolve potential false positives.
            exact_exists = await client.exists(exact_key)
            
            if exact_exists:
                # Verified Absolute Duplicate!
                self.logger.warning(f"Replay attack or duplicate transaction blocked at ingestion: '{txn_id}'")
                return True
            
            # False Positive! The transaction is actually novel.
            # Register it in our exact matching register and return False to let it pass
            await client.set(exact_key, "1", ex=self.ttl_seconds)
            self.logger.info(f"Bloom Filter false positive detected and bypassed for transaction: '{txn_id}'")
            return False

        return await self._execute_with_retry(_check_and_set_logic)

    async def close(self) -> None:
        """Gracefully release connection pool sockets."""
        await self.pool.disconnect()
        self.logger.info("Deduplication Guard connection pool gracefully released.")

    async def _execute_with_retry(self, action: Callable[[aioredis.Redis], Any]) -> Any:
        """
        Execute a Redis operation wrapped inside an exponential backoff retry loop.
        
        Protects stateful stream operations from transient Redis network errors and cluster node failovers.
        """
        delay = self.base_retry_delay
        last_exception: Optional[Exception] = None

        for attempt in range(1, self.max_retries + 1):
            try:
                # Instantiate a connection client sharing the connection pool
                client = aioredis.Redis(connection_pool=self.pool)
                return await action(client)
            except (ConnectionError, TimeoutError, OSError) as e:
                last_exception = e
                if attempt == self.max_retries:
                    break
                
                self.logger.warning(
                    f"Redis connection failure on attempt {attempt}/{self.max_retries}: {e}. "
                    f"Retrying in {delay:.2f} seconds..."
                )
                await asyncio.sleep(delay)
                delay *= 2  # Double wait delay time

        # Exhausted all attempts. Raise clean RedisConnectionException.
        raise RedisConnectionException(
            f"Redis cluster operation failed after {self.max_retries} attempts: {last_exception}"
        ) from last_exception

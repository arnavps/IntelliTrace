"""
Comprehensive asynchronous functional and resilience test suite for the
IngestionDeduplicationGuard caching layer.
"""

import asyncio
import os
import sys
import unittest
from unittest.mock import AsyncMock, MagicMock, patch

# Ensure the src directory is in the python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src")))

from intellitrace import IngestionDeduplicationGuard, RedisConnectionException
from redis.exceptions import ConnectionError, TimeoutError, ResponseError


class TestIngestionDeduplicationGuard(unittest.IsolatedAsyncioTestCase):
    """Asynchronous testing framework for Redis Distributed Deduplication Guard."""

    def setUp(self):
        self.redis_url = "redis://mock-redis-cluster:6379/0"
        self.filter_name = "cbs:txn:bloom"
        
        # Instantiate guard with short delays for lightning-fast unit tests
        self.guard = IngestionDeduplicationGuard(
            redis_url=self.redis_url,
            filter_name=self.filter_name,
            max_retries=3,
            base_retry_delay=0.001
        )
        
        # Maintain internal mock Redis state
        self.mock_bloom_filter = set()
        self.mock_exact_keys = {}

    async def asyncTearDown(self):
        # Clean up connection pools
        await self.guard.close()

    def _setup_mock_redis_client(self, mock_redis_class):
        """Helper to create a fully functional simulated Redis transaction environment."""
        mock_client = AsyncMock()
        
        # BF.RESERVE command mock
        async def mock_execute_command(cmd, *args):
            cmd_upper = cmd.upper()
            if cmd_upper == "BF.RESERVE":
                return "OK"
            elif cmd_upper == "BF.EXISTS":
                # args[0] is filter_name, args[1] is txn_id
                txn_id = args[1]
                return 1 if txn_id in self.mock_bloom_filter else 0
            elif cmd_upper == "BF.ADD":
                txn_id = args[1]
                self.mock_bloom_filter.add(txn_id)
                return 1
            raise ValueError(f"Mock executed unhandled Redis command: {cmd}")
            
        mock_client.execute_command = mock_execute_command

        # Exact key exists mock
        async def mock_exists(key):
            return 1 if key in self.mock_exact_keys else 0
        mock_client.exists = mock_exists

        # Exact key set mock
        async def mock_set(key, val, **kwargs):
            self.mock_exact_keys[key] = val
            return True
        mock_client.set = mock_set

        # Pipeline mock simulation
        mock_pipeline = AsyncMock()
        
        def mock_pipe_execute_command(cmd, *args):
            # In pipeline, BF.ADD adds to mock state directly
            if cmd.upper() == "BF.ADD":
                self.mock_bloom_filter.add(args[1])
            return mock_pipeline
        mock_pipeline.execute_command = mock_pipe_execute_command
        
        def mock_pipe_set(key, val, **kwargs):
            self.mock_exact_keys[key] = val
            return mock_pipeline
        mock_pipeline.set = mock_pipe_set
        
        # Enter context manager for pipeline
        mock_pipeline.__aenter__.return_value = mock_pipeline
        mock_client.pipeline = MagicMock(return_value=mock_pipeline)

        # Bind mock client instances to class instantiation patch
        mock_redis_class.return_value = mock_client
        return mock_client

    @patch("redis.asyncio.Redis")
    async def test_guard_initialization_success(self, mock_redis_class):
        """Verify dynamic pre-reservation runs without errors."""
        self._setup_mock_redis_client(mock_redis_class)
        await self.guard.initialize()

    @patch("redis.asyncio.Redis")
    async def test_guard_initialization_already_reserved(self, mock_redis_class):
        """Verify dynamic reservation behaves idempotently if slot is already reserved."""
        mock_client = self._setup_mock_redis_client(mock_redis_class)
        
        # Mock already-reserved busy exception
        async def mock_fail_execute(cmd, *args):
            if cmd.upper() == "BF.RESERVE":
                raise ResponseError("Item already exists")
            return "OK"
            
        mock_client.execute_command = mock_fail_execute

        # Should swallow the already-exists error cleanly
        await self.guard.initialize()

    @patch("redis.asyncio.Redis")
    async def test_deduplication_novel_transaction(self, mock_redis_class):
        """Verify that a brand new transaction ID registers successfully and returns False."""
        self._setup_mock_redis_client(mock_redis_class)
        txn_id = "txn_novel_101"

        is_duplicate = await self.guard.is_duplicate_or_record(txn_id)
        
        self.assertFalse(is_duplicate)
        # Should be added to both filter and exact verification lookup
        self.assertIn(txn_id, self.mock_bloom_filter)
        self.assertIn(f"cbs:txn:exact:{txn_id}", self.mock_exact_keys)

    @patch("redis.asyncio.Redis")
    async def test_deduplication_exact_duplicate(self, mock_redis_class):
        """Verify that absolute duplicate transaction returns True instantly."""
        self._setup_mock_redis_client(mock_redis_class)
        txn_id = "txn_duplicate_202"
        
        # Pre-seed both exact matching table and Bloom filter
        self.mock_bloom_filter.add(txn_id)
        self.mock_exact_keys[f"cbs:txn:exact:{txn_id}"] = "1"

        is_duplicate = await self.guard.is_duplicate_or_record(txn_id)
        self.assertTrue(is_duplicate)

    @patch("redis.asyncio.Redis")
    async def test_deduplication_bloom_false_positive_recovery(self, mock_redis_class):
        """Verify that Bloom Filter false positives are safely bypassed without blocking transaction."""
        self._setup_mock_redis_client(mock_redis_class)
        txn_id = "txn_false_positive_303"
        
        # Pre-seed Bloom filter ONLY (simulates false positive math collision)
        # exact key remains unseeded
        self.mock_bloom_filter.add(txn_id)

        is_duplicate = await self.guard.is_duplicate_or_record(txn_id)
        
        # Must resolve false positive: return False and write exact verify key
        self.assertFalse(is_duplicate)
        self.assertIn(f"cbs:txn:exact:{txn_id}", self.mock_exact_keys)

    @patch("redis.asyncio.Redis")
    async def test_resilience_backoff_retry_recovery(self, mock_redis_class):
        """Verify that transient Redis failures trigger successful backoff retries."""
        mock_client = AsyncMock()
        
        # Attempt counter
        self.attempts = 0

        async def mock_resilient_exists(key):
            self.attempts += 1
            if self.attempts < 3:
                # Fail first two attempts with network error
                raise ConnectionError("Node rebalancing in progress")
            return 0  # Succeed on 3rd attempt

        mock_client.exists = mock_resilient_exists
        
        # Mock Bloom Filter Check to return 1 (force exact lookup)
        async def mock_resilient_execute_command(cmd, *args):
            return 1
        mock_client.execute_command = mock_resilient_execute_command
        
        mock_redis_class.return_value = mock_client

        # Call guard check
        is_duplicate = await self.guard.is_duplicate_or_record("txn_retry_404")
        
        # Verify recovery on 3rd attempt
        self.assertEqual(self.attempts, 3)
        self.assertFalse(is_duplicate)

    @patch("redis.asyncio.Redis")
    async def test_resilience_retry_exhaustion_failure(self, mock_redis_class):
        """Verify that continuous Redis failures raise RedisConnectionException once retries are exhausted."""
        mock_client = AsyncMock()
        
        # Always fail with TimeoutError
        async def mock_fail_exists(key):
            raise TimeoutError("Redis node unresponsive")
            
        mock_client.exists = mock_fail_exists
        
        async def mock_resilient_execute_command(cmd, *args):
            return 1
        mock_client.execute_command = mock_resilient_execute_command
        
        mock_redis_class.return_value = mock_client

        # Must exhaust all 3 retries and raise RedisConnectionException
        with self.assertRaises(RedisConnectionException):
            await self.guard.is_duplicate_or_record("txn_fail_505")


if __name__ == "__main__":
    unittest.main()

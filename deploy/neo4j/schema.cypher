// ============================================================================
// IntelliTrace Neo4j 5.x Heterogeneous Temporal Graph Schema Configuration
// Tailored for Real-Time Financial Crime, Money Mule, and Layering Analysis
// ============================================================================

// ----------------------------------------------------------------------------
// PART 1: UNIQUE IDENTITY CONSTRAINTS
// ----------------------------------------------------------------------------
// Ensures entity uniqueness at the database level to maintain graph structure
// integrity under high-throughput write workloads.

CREATE CONSTRAINT customer_id_unique IF NOT EXISTS FOR (c:Customer) REQUIRE c.customer_id IS UNIQUE;
CREATE CONSTRAINT account_id_unique IF NOT EXISTS FOR (a:Account) REQUIRE a.account_id IS UNIQUE;
CREATE CONSTRAINT txn_id_unique IF NOT EXISTS FOR (t:Transaction) REQUIRE t.txn_id IS UNIQUE;
CREATE CONSTRAINT device_hash_unique IF NOT EXISTS FOR (d:Device) REQUIRE d.device_hash IS UNIQUE;
CREATE CONSTRAINT ip_address_unique IF NOT EXISTS FOR (ip:IPAddress) REQUIRE ip.ip_address IS UNIQUE;
CREATE CONSTRAINT merchant_id_unique IF NOT EXISTS FOR (m:Merchant) REQUIRE m.merchant_id IS UNIQUE;
CREATE CONSTRAINT company_id_unique IF NOT EXISTS FOR (co:Company) REQUIRE co.company_id IS UNIQUE;

// ----------------------------------------------------------------------------
// PART 2: HIGH-PERFORMANCE B-TREE PROPERTY INDEXES (Neo4j 5.x Syntax)
// ----------------------------------------------------------------------------
// Accelerates multi-hop graph traversals, range scans, and temporal filtering
// under heavy transactional search workloads.

CREATE INDEX customer_risk_index IF NOT EXISTS FOR (c:Customer) ON (c.risk_profile);
CREATE INDEX customer_kyc_index IF NOT EXISTS FOR (c:Customer) ON (c.kyc_tier);
CREATE INDEX customer_income_index IF NOT EXISTS FOR (c:Customer) ON (c.declared_income);

CREATE INDEX account_opening_index IF NOT EXISTS FOR (a:Account) ON (a.opening_date);
CREATE INDEX account_status_index IF NOT EXISTS FOR (a:Account) ON (a.current_status);
CREATE INDEX account_balance_index IF NOT EXISTS FOR (a:Account) ON (a.account_balance);

CREATE INDEX transaction_timestamp_index IF NOT EXISTS FOR (t:Transaction) ON (t.txn_timestamp);
CREATE INDEX transaction_amount_index IF NOT EXISTS FOR (t:Transaction) ON (t.amount_inr);
CREATE INDEX transaction_channel_index IF NOT EXISTS FOR (t:Transaction) ON (t.channel);

CREATE INDEX device_os_index IF NOT EXISTS FOR (d:Device) ON (d.os_type);

CREATE INDEX ip_country_index IF NOT EXISTS FOR (ip:IPAddress) ON (ip.geolocation_country);
CREATE INDEX ip_vpn_index IF NOT EXISTS FOR (ip:IPAddress) ON (ip.vpn_flag);

CREATE INDEX merchant_mcc_index IF NOT EXISTS FOR (m:Merchant) ON (m.mcc_code);

// ----------------------------------------------------------------------------
// PART 3: FULL-TEXT SEARCH INDEXES
// ----------------------------------------------------------------------------
// Supports fuzzy searches, wildcard lookups, and phonetic matching on string
// fields during forensic investigation and automated account matching.

CREATE FULLTEXT INDEX customer_name_search IF NOT EXISTS FOR (c:Customer) ON EACH [c.customer_name];
CREATE FULLTEXT INDEX business_name_search IF NOT EXISTS FOR (m:Merchant, co:Company) ON EACH [m.business_name, co.legal_status];

// ----------------------------------------------------------------------------
// PART 4: TEMPORAL DATA INGESTION TEMPLATES (MERGE PATTERNS)
// ----------------------------------------------------------------------------
// These queries show how data is upserted continuously, preserving historical
// properties and tracking time-series graph evolutions.

/*
// Ingest / Update Account Node
MERGE (a:Account {account_id: $account_id})
ON CREATE SET 
    a.account_type = $account_type,
    a.opening_date = datetime($opening_date),
    a.current_status = $current_status,
    a.account_balance = toFloat($account_balance),
    a.created_at = datetime()
ON MATCH SET 
    a.current_status = $current_status,
    a.account_balance = toFloat($account_balance),
    a.updated_at = datetime();

// Ingest / Append Transaction Edge
MATCH (src:Account {account_id: $src_account_id})
MATCH (dst:Account {account_id: $dst_account_id})
CREATE (src)-[r:TRANSFERRED_TO {
    txn_id: $txn_id,
    amount: toFloat($amount_inr),
    timestamp: datetime($txn_timestamp),
    channel: $channel,
    sequence_in_chain: toInteger($sequence_in_chain),
    hop_count_from_origin: toInteger($hop_count_from_origin),
    time_since_origin: toInteger($time_since_origin),
    valid_from: datetime($txn_timestamp),
    valid_to: datetime("9999-12-31T23:59:59Z")
}]->(dst);
*/

// ----------------------------------------------------------------------------
// PART 5: ADVANCED TEMPORAL FRAUD QUERIES
// ----------------------------------------------------------------------------
// High-efficiency, multi-hop temporal traversals designed to track complex 
// money laundering, layering, smurfing, and money mule mobilization patterns.

// Query 5.1: Multi-Hop Rapid Layering Chain and Graph Lineage Tracer
// Identifies accounts executing rapid out-dispersal across a multi-hop path
// within a strict chronological temporal sequence.
/*
MATCH path = (origin:Account)-[r:TRANSFERRED_TO*1..5]->(terminus:Account)
WHERE ALL(idx IN range(0, size(r)-2) 
    WHERE (r[idx]).timestamp < (r[idx+1]).timestamp 
      AND duration.between((r[idx]).timestamp, (r[idx+1]).timestamp).inSeconds <= 7200 // 2-hour sliding window per hop
)
AND (r[0]).amount >= 500000.0 // Massive initial credit
AND (r[size(r)-1]).hop_count_from_origin >= 3 // Deeper hop lineage
RETURN 
    [a IN nodes(path) | a.account_id] AS account_chain,
    [rel IN relationships(path) | rel.txn_id] AS txn_ids,
    [rel IN relationships(path) | rel.amount] AS amounts,
    [rel IN relationships(path) | rel.timestamp] AS timestamps,
    size(r) AS hops;
*/

// Query 5.2: Smurfing Cycle and Structure Placement Detector
// Identifies structural credits falling just under the cash-reporting limit (₹50,000)
// aggregating to >= ₹500,000 within a 60-minute sliding event time-window.
/*
MATCH (target:Account)<-[r:TRANSFERRED_TO]-(src:Account)
WHERE r.timestamp >= datetime($window_start) 
  AND r.timestamp <= datetime($window_end)
  AND r.amount >= 10000.0 AND r.amount <= 49999.0
WITH target, count(r) AS consecutive_credits, sum(r.amount) AS total_amount, collect(r) AS txns
WHERE consecutive_credits > 10 AND total_amount >= 500000.0
RETURN 
    target.account_id AS target_account_id,
    consecutive_credits,
    total_amount,
    [tx IN txns | {txn_id: tx.txn_id, amount: tx.amount, timestamp: tx.timestamp}] AS credit_transactions;
*/

// Query 5.3: Money Mule Dormant Activation & Device-Sharing Ring Detector
// Uncovers dormant accounts activated by massive credits, followed by rapid outward
// dispersal (>90%) to novel, unmapped accounts sharing device fingerprints/IP addresses.
/*
MATCH (mule:Account)<-[activation:TRANSFERRED_TO]-(src:Account)
WHERE mule.current_status = "ACTIVE"
  // Check dormancy (180 days interval since last tx, e.g. opening_date or previous log-ins)
  AND duration.between(mule.opening_date, activation.timestamp).days >= 180
  AND activation.amount > 10.0 * mule.account_balance // Massive spike relative to baseline

// Match out-dispersal within 2 hours
MATCH (mule)-[dispersal:TRANSFERRED_TO]->(novel:Account)
WHERE dispersal.timestamp >= activation.timestamp 
  AND dispersal.timestamp <= activation.timestamp + duration({hours: 2})
  
// Check that the novel account has no historical relation to this customer
AND NOT (novel)<-[:OWNS]-(:Customer)-[:OWNS]->(mule)

// Collect and verify if >90% was dispersed
WITH mule, activation, collect(dispersal) AS out_txns, sum(dispersal.amount) AS total_out
WHERE total_out >= 0.90 * activation.amount

// Identify shared device and IP footprints associated with the transaction ring
MATCH (t:Transaction {txn_id: activation.txn_id})-[:INITIATED_FROM]->(dev:Device)
MATCH (mule)-[:CONNECTED_VIA]->(ip:IPAddress)
RETURN 
    mule.account_id AS mule_account_id,
    activation.txn_id AS activation_txn,
    activation.amount AS injected_amount,
    total_out AS total_dispersed,
    total_out / activation.amount AS dispersal_ratio,
    dev.device_hash AS shared_device,
    ip.ip_address AS shared_ip,
    ip.vpn_flag AS is_vpn;
*/

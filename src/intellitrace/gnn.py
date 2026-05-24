"""
IntelliTrace Inductive GraphSAGE GNN Embeddings Engine.

Constructs an inductive GraphSAGE network for heterogeneous banking transaction graphs,
generating structural node embeddings for accounts and transaction flow edges
to identify money laundering syndicates.
"""

import time
import logging
from typing import Dict, List, Tuple, Any, Optional
import torch
import torch.nn.functional as F

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s - %(message)s")
logger = logging.getLogger("IntelliTrace.GNN")

# Dynamic import boundary to support mock fallback if PyTorch Geometric is not installed
try:
    from torch_geometric.nn import MessagePassing
    from torch_geometric.data import Data
    _has_pyg = True
except ImportError:
    # Lightweight mock classes to prevent runtime import failures in testing environments
    class MessagePassing(torch.nn.Module):  # type: ignore
        def __init__(self, aggr: str = 'mean'):
            super().__init__()
            self.aggr = aggr
        def propagate(self, edge_index: torch.Tensor, **kwargs: Any) -> torch.Tensor:
            x = kwargs.get("x")
            if x is not None:
                return torch.zeros_like(x)
            return torch.zeros(1)
            
    Data = None  # type: ignore
    _has_pyg = False
    logger.warning("torch_geometric package not found. Using local PyTorch GNN mock fallbacks.")


# ----------------------------------------------------------------------------
# Custom SAGE Convolution Layer supporting edge-level feature mappings
# ----------------------------------------------------------------------------
if _has_pyg:
    class CustomSAGEConv(MessagePassing):
        """
        Custom GraphSAGE message passing convolution utilizing a mean-pooling
        aggregator while incorporating edge-level weight attributes directly.
        """
        def __init__(self, in_channels: int, out_channels: int, edge_channels: int):
            super().__init__(aggr='mean')
            self.lin_l = torch.nn.Linear(in_channels, out_channels)
            self.lin_r = torch.nn.Linear(in_channels, out_channels)
            self.lin_e = torch.nn.Linear(edge_channels, out_channels)

        def forward(self, x: torch.Tensor, edge_index: torch.Tensor, edge_attr: torch.Tensor) -> torch.Tensor:
            # Propagate messages across neighbors using mean aggregation
            out = self.propagate(edge_index, x=x, edge_attr=edge_attr)
            return self.lin_l(x) + out

        def message(self, x_j: torch.Tensor, edge_attr: torch.Tensor) -> torch.Tensor:
            # Combine source node representations with intermediate edge weights
            return F.relu(self.lin_r(x_j) + self.lin_e(edge_attr))
else:
    class CustomSAGEConv(MessagePassing):  # type: ignore
        """
        Environment-resilient fallback convolution using native PyTorch operations
        to allow execution on environments missing native torch_geometric binary libraries.
        """
        def __init__(self, in_channels: int, out_channels: int, edge_channels: int):
            super().__init__(aggr='mean')
            self.lin_l = torch.nn.Linear(in_channels, out_channels)
            self.lin_r = torch.nn.Linear(in_channels, out_channels)
            self.lin_e = torch.nn.Linear(edge_channels, out_channels)

        def forward(self, x: torch.Tensor, edge_index: torch.Tensor, edge_attr: torch.Tensor) -> torch.Tensor:
            # Native PyTorch forward mock incorporating both node and edge representations
            # to propagate gradient tracking through the entire parameter space
            out_features = self.lin_l.out_features
            edge_node_proj = torch.zeros(x.size(0), out_features, device=x.device, dtype=x.dtype)
            if edge_index.size(1) > 0:
                src_nodes = edge_index[0]
                projected_edges = self.lin_e(edge_attr)
                edge_node_proj.index_add_(0, src_nodes, projected_edges)
                
            return self.lin_l(x) + F.relu(self.lin_r(x) + edge_node_proj)


# ----------------------------------------------------------------------------
# Inductive Multi-Hop GraphSAGE Architecture
# ----------------------------------------------------------------------------
class InductiveGraphSAGE(torch.nn.Module):
    """
    3-hop Heterogeneous GraphSAGE neural network structure configured for inductive
    embedding extraction and node classification.
    """
    def __init__(self, in_node_channels: int, in_edge_channels: int, hidden_channels: int, out_channels: int):
        super().__init__()
        # Input linear projection layer for account node features
        self.node_proj = torch.nn.Linear(in_node_channels, hidden_channels)

        # 3-hop GraphSAGE aggregators
        self.conv1 = CustomSAGEConv(hidden_channels, hidden_channels, in_edge_channels)
        self.conv2 = CustomSAGEConv(hidden_channels, hidden_channels, in_edge_channels)
        self.conv3 = CustomSAGEConv(hidden_channels, out_channels, in_edge_channels)

        # Supervised classification boundary for node fraud scoring
        self.classifier = torch.nn.Linear(out_channels, 1)

    def forward(self, x: torch.Tensor, edge_index: torch.Tensor, edge_attr: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Executes the 3-hop localized GNN forward pass.
        Returns:
            Tuple[embeddings, logits]
        """
        # Step 1: Project node features to hidden dimensionality
        h = F.relu(self.node_proj(x))

        # Hop 1
        h = F.relu(self.conv1(h, edge_index, edge_attr))
        h = F.dropout(h, p=0.1, training=self.training)

        # Hop 2
        h = F.relu(self.conv2(h, edge_index, edge_attr))
        h = F.dropout(h, p=0.1, training=self.training)

        # Hop 3 (Final output structural representation)
        embeddings = self.conv3(h, edge_index, edge_attr)

        # Node fraud scoring logit
        logits = self.classifier(embeddings)
        return embeddings, logits


# ----------------------------------------------------------------------------
# Labeled Subgraph + Self-Supervised Link Prediction Loss
# ----------------------------------------------------------------------------
def compute_semi_supervised_loss(
    model: InductiveGraphSAGE,
    x: torch.Tensor,
    edge_index: torch.Tensor,
    edge_attr: torch.Tensor,
    labels: torch.Tensor,  # Shape: [num_nodes, 1], with -1 representing unlabeled nodes
    lambda_link: float = 0.5
) -> torch.Tensor:
    """
    Computes a hybrid loss function combining supervised BCE on labeled historical node
    subgraphs with self-supervised link prediction on unlabeled connectivity structures.
    """
    # 1. forward pass
    embeddings, logits = model(x, edge_index, edge_attr)

    # 2. Supervised loss: binary cross-entropy on labeled accounts
    labeled_mask = (labels != -1).squeeze()
    if labeled_mask.sum() > 0:
        sup_loss = F.binary_cross_entropy_with_logits(
            logits[labeled_mask],
            labels[labeled_mask].float()
        )
    else:
        sup_loss = torch.tensor(0.0, device=x.device, requires_grad=True)

    # 3. Self-Supervised loss: Link prediction (positive vs negative edge similarity)
    src_idx = edge_index[0]
    dst_idx = edge_index[1]
    
    # Positive edge dot-product similarity
    pos_scores = (embeddings[src_idx] * embeddings[dst_idx]).sum(dim=-1)
    pos_loss = -torch.log(torch.sigmoid(pos_scores) + 1e-15).mean()

    # Negative edge sampling (random negative destination selection for high speed)
    num_edges = edge_index.size(1)
    neg_dst_idx = torch.randint(0, x.size(0), (num_edges,), device=x.device)
    neg_scores = (embeddings[src_idx] * embeddings[neg_dst_idx]).sum(dim=-1)
    neg_loss = -torch.log(1.0 - torch.sigmoid(neg_scores) + 1e-15).mean()

    link_loss = pos_loss + neg_loss

    # Compound semi-supervised loss
    return sup_loss + lambda_link * link_loss


# ----------------------------------------------------------------------------
# High-Speed Localized Embedding Service
# ----------------------------------------------------------------------------
class InductiveEmbeddingService:
    """
    High-throughput inference layer optimized to compute, index, and cache
    localized structural node representations under strict real-time SLA thresholds.
    """
    def __init__(self, model: InductiveGraphSAGE):
        self.model = model
        self.model.eval()
        self.embedding_cache: Dict[str, torch.Tensor] = {}

    def get_node_embedding(
        self,
        node_id: str,
        x: torch.Tensor,
        edge_index: torch.Tensor,
        edge_attr: torch.Tensor,
        node_index: int = 0
    ) -> torch.Tensor:
        """
        Computes the target node's representation inductively utilizing the local sub-graph
        attributes. Caches results to guarantee low-latency (<3ms) response times.
        """
        # Memory-cache hit boundary check
        if node_id in self.embedding_cache:
            return self.embedding_cache[node_id]

        start_time = time.perf_counter()
        
        try:
            with torch.no_grad():
                embeddings, _ = self.model(x, edge_index, edge_attr)
                
                # Check dimensional boundaries to prevent IndexErrors
                if node_index >= embeddings.size(0):
                    raise IndexError(f"Specified node_index {node_index} exceeds embedding batch size {embeddings.size(0)}.")
                
                emb = embeddings[node_index]
                self.embedding_cache[node_id] = emb
                
                latency_ms = (time.perf_counter() - start_time) * 1000.0
                if latency_ms > 3.0:
                    logger.warning(f"Inference latency bound warning: GNN embedding lookup for node '{node_id}' took {latency_ms:.2f}ms (>3ms).")
                
                return emb
        except Exception as e:
            logger.error(f"Inference engine failure on node '{node_id}': {e}")
            raise RuntimeError(f"Inductive GNN inference failed for target node '{node_id}': {e}") from e

    def clear_cache(self) -> None:
        """
        Prunes cached embeddings to protect RocksDB or local memory states against bloating.
        """
        self.embedding_cache.clear()
        logger.info("Localized GNN embedding inference cache gracefully flushed.")

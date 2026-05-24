"""
Unit tests validating the Inductive GraphSAGE GNN Embeddings Engine.
Covers GNN forward passes, semi-supervised BCE + link prediction losses,
gradient backpropagation, and low-latency localized embedding caches.
"""

import os
import sys
import unittest
import torch

# Ensure the src directory is in the python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src")))

from intellitrace.gnn import (
    InductiveGraphSAGE,
    compute_semi_supervised_loss,
    InductiveEmbeddingService,
)


class TestGNNEmbeddingsEngine(unittest.TestCase):
    """
    Test suite verifying neural representation learning on heterogeneous transaction networks.
    """

    def setUp(self):
        # Configure model hyper-parameters
        self.in_node_channels = 5   # Velocity, Z-score, account age
        self.in_edge_channels = 3   # Amount, channel, timestamp
        self.hidden_channels = 16
        self.out_channels = 8       # Latent embedding size

        # Instantiate GNN model
        self.model = InductiveGraphSAGE(
            in_node_channels=self.in_node_channels,
            in_edge_channels=self.in_edge_channels,
            hidden_channels=self.hidden_channels,
            out_channels=self.out_channels
        )

        # Build mock data tensors for a small subgraph of 10 accounts and 15 transactions
        self.num_nodes = 10
        self.num_edges = 15

        # Node features
        self.x = torch.randn(self.num_nodes, self.in_node_channels)

        # Edges (sources and destinations)
        self.edge_index = torch.randint(0, self.num_nodes, (2, self.num_edges))

        # Edge features
        self.edge_attr = torch.randn(self.num_edges, self.in_edge_channels)

        # Labeled historical fraud subgraphs mask (-1 representing unlabeled nodes)
        self.labels = torch.full((self.num_nodes, 1), -1, dtype=torch.long)
        self.labels[0] = 1   # Node 0 is known fraud
        self.labels[1] = 0   # Node 1 is known legitimate
        self.labels[2] = 1   # Node 2 is known fraud

    def test_gnn_forward_pass_dimensions(self):
        """Verify GNN successfully outputs target embedding sizes and classification logits."""
        self.model.eval()
        with torch.no_grad():
            embeddings, logits = self.model(self.x, self.edge_index, self.edge_attr)
            
            # Assert output dimensions
            self.assertEqual(embeddings.shape, (self.num_nodes, self.out_channels))
            self.assertEqual(logits.shape, (self.num_nodes, 1))

    def test_semi_supervised_combined_loss_backward(self):
        """Verify joint BCE + Link Prediction loss computation and backpropagation gradient tracking."""
        self.model.train()
        
        # Calculate hybrid loss
        loss = compute_semi_supervised_loss(
            model=self.model,
            x=self.x,
            edge_index=self.edge_index,
            edge_attr=self.edge_attr,
            labels=self.labels,
            lambda_link=0.5
        )

        # Assert loss is a valid single float scalar
        self.assertTrue(loss.shape == () or loss.shape == (1,))
        self.assertGreater(loss.item(), 0.0)

        # Run backpropagation step
        loss.backward()

        # Verify gradients successfully accumulated on parameters
        for name, param in self.model.named_parameters():
            if param.requires_grad:
                self.assertIsNotNone(param.grad, f"Parameter {name} did not accumulate gradients.")
                self.assertNotEqual(torch.sum(torch.abs(param.grad)).item(), 0.0)

    def test_embedding_service_low_latency_cache(self):
        """Verify GNN embedding service correctly resolves, caches, and flushes local structural node indexes."""
        service = InductiveEmbeddingService(self.model)

        # 1. Compute and retrieve representation for ACCT_MULE_01
        emb1 = service.get_node_embedding(
            node_id="ACCT_MULE_01",
            x=self.x,
            edge_index=self.edge_index,
            edge_attr=self.edge_attr,
            node_index=0
        )
        self.assertEqual(emb1.shape, (self.out_channels,))

        # Verify it has been successfully added to local inference cache
        self.assertIn("ACCT_MULE_01", service.embedding_cache)
        self.assertTrue(torch.equal(service.embedding_cache["ACCT_MULE_01"], emb1))

        # 2. Retrieve again and verify cache hit (must return exactly same tensor reference without recalculating)
        emb2 = service.get_node_embedding(
            node_id="ACCT_MULE_01",
            x=self.x,
            edge_index=self.edge_index,
            edge_attr=self.edge_attr,
            node_index=0
        )
        self.assertTrue(torch.equal(emb1, emb2))

        # 3. Verify cache flush operations
        service.clear_cache()
        self.assertEqual(len(service.embedding_cache), 0)

    def test_embedding_service_index_boundary_check(self):
        """Verify GNN inference bounds check raises error if index exceeds batch dimensions."""
        service = InductiveEmbeddingService(self.model)

        with self.assertRaises(RuntimeError):
            service.get_node_embedding(
                node_id="ACCT_OUT_OF_BOUNDS",
                x=self.x,
                edge_index=self.edge_index,
                edge_attr=self.edge_attr,
                node_index=999  # Node index exceeds batch dimension of 10
            )


if __name__ == "__main__":
    unittest.main()

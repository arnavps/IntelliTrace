import { useState, useCallback, useRef } from 'react';
import type { Core, NodeSingular, CollectionReturnValue } from 'cytoscape';

export type GraphMode = 'explore' | 'shortest-path' | 'community' | 'temporal';

export interface GraphFilterState {
  minAmount: number;
  maxAmount: number;
  startTime: number;
  endTime: number;
  riskThreshold: number;
}

export const useGraphExploration = () => {
  const [mode, setMode] = useState<GraphMode>('explore');
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [filterState, setFilterState] = useState<GraphFilterState>({
    minAmount: 0,
    maxAmount: 10000000,
    startTime: Date.now() - 30 * 24 * 60 * 60 * 1000, // Last 30 days
    endTime: Date.now(),
    riskThreshold: 0.5,
  });

  // Reference to the active Cytoscape instance
  const cyRef = useRef<Core | null>(null);

  /**
   * Initializes the cytoscape reference from the Canvas component
   */
  const bindCyInstance = useCallback((cy: Core) => {
    cyRef.current = cy;
    
    // Bind selection events
    cy.on('select', 'node', (e) => {
      const node = e.target as NodeSingular;
      setSelectedNodes(prev => [...prev, node.id()]);
    });
    
    cy.on('unselect', 'node', (e) => {
      const node = e.target as NodeSingular;
      setSelectedNodes(prev => prev.filter(id => id !== node.id()));
    });
  }, []);

  /**
   * 1-Click Vertex Expansion: Expands the selected node by N degrees
   */
  const expandVertex = useCallback(async (nodeId: string, degrees: number = 1) => {
    if (!cyRef.current) return;
    const cy = cyRef.current;
    
    // In a real implementation, this would trigger an API call to the backend
    // to fetch the neighborhood from Neo4j.
    console.log(`[API MOCK] Fetching ${degrees}-degree neighborhood for ${nodeId} from Neo4j...`);
    
    // Visually highlight the expansion zone for immediate UX feedback
    const rootNode = cy.getElementById(nodeId);
    if (!rootNode.empty()) {
      cy.elements().removeClass('highlighted faded');
      
      let neighborhood = rootNode;
      for (let i = 0; i < degrees; i++) {
        neighborhood = neighborhood.union(neighborhood.neighborhood());
      }
      
      cy.elements().difference(neighborhood).addClass('faded');
      neighborhood.addClass('highlighted');
      
      // Re-run layout on the neighborhood to expand it smoothly
      neighborhood.layout({
        name: 'cose',
        animate: true,
        animationDuration: 500
      }).run();
    }
  }, []);

  /**
   * Automated Shortest Path Tracing
   */
  const traceShortestPath = useCallback((sourceId: string, targetId: string) => {
    if (!cyRef.current) return;
    const cy = cyRef.current;
    
    cy.elements().removeClass('highlighted faded path');
    
    // Run client-side Dijkstra algorithm
    const dijkstra = cy.elements().dijkstra({
      root: `#${sourceId}`,
      weight: (edge) => 1 / (edge.data('amount') || 1), // Higher amounts = lower weight (prefer high-value paths)
      directed: true
    });
    
    const path: CollectionReturnValue = dijkstra.pathTo(cy.getElementById(targetId));
    
    if (path && !path.empty()) {
      cy.elements().addClass('faded');
      path.removeClass('faded').addClass('highlighted path');
      
      // Zoom to path
      cy.animate({
        fit: {
          eles: path,
          padding: 50
        },
        duration: 800
      });
    } else {
      console.warn(`No path found between ${sourceId} and ${targetId}`);
    }
  }, []);

  /**
   * Overlay Community Density (Louvain Modularity coloring)
   */
  const overlayCommunityDensity = useCallback(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;
    
    setMode('community');
    
    // Color palette for communities
    const colors = ['#38bdf8', '#8b5cf6', '#ef4444', '#10b981', '#f59e0b', '#ec4899'];
    
    cy.batch(() => {
      cy.nodes().forEach(node => {
        // Assume 'communityId' is populated by the GraphSAGE pipeline
        const cid = node.data('communityId') || 0;
        node.style('background-color', colors[cid % colors.length]);
      });
    });
  }, []);

  /**
   * Export Graph for Reporting
   */
  const exportGraph = useCallback((format: 'png' | 'json' = 'png') => {
    if (!cyRef.current) return;
    
    if (format === 'png') {
      const b64 = cyRef.current.png({ bg: '#07090e', full: true });
      const a = document.createElement('a');
      a.href = b64;
      a.download = `intellitrace-graph-${new Date().toISOString()}.png`;
      a.click();
    } else if (format === 'json') {
      const json = cyRef.current.json();
      const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `intellitrace-graph-${new Date().toISOString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, []);

  return {
    mode,
    setMode,
    selectedNodes,
    filterState,
    setFilterState,
    bindCyInstance,
    expandVertex,
    traceShortestPath,
    overlayCommunityDensity,
    exportGraph,
  };
};

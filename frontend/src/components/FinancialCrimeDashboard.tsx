import React, { useState, useEffect } from 'react';
import { ElementDefinition } from 'cytoscape';
import { NetworkCanvas } from './NetworkCanvas';
import { useGraphExploration } from '../hooks/useGraphExploration';
import { 
  Network, 
  Search, 
  Activity, 
  Clock, 
  ShieldAlert, 
  Download, 
  GitCommit, 
  Maximize2 
} from 'lucide-react';

// MOCK DATA for initial rendering proof-of-concept
const MOCK_GRAPH: ElementDefinition[] = [
  { data: { id: 'acct_1', label: 'ACC-1204', type: 'ACCOUNT', riskScore: 0.9, communityId: 1 } },
  { data: { id: 'acct_2', label: 'ACC-9932', type: 'ACCOUNT', riskScore: 0.2, communityId: 1 } },
  { data: { id: 'ent_1', label: 'Shell Corp LLC', type: 'ENTITY', riskScore: 0.95, communityId: 1 } },
  { data: { id: 'bank_1', label: 'Offshore Bank X', type: 'BANK', riskScore: 0.5, communityId: 2 } },
  
  { data: { id: 'e1', source: 'acct_1', target: 'ent_1', amount: 50000, label: 'WIRE' } },
  { data: { id: 'e2', source: 'acct_2', target: 'ent_1', amount: 12000, label: 'ACH' } },
  { data: { id: 'e3', source: 'ent_1', target: 'bank_1', amount: 62000, label: 'SWIFT' } },
];

export const FinancialCrimeDashboard: React.FC = () => {
  const [elements, setElements] = useState<ElementDefinition[]>(MOCK_GRAPH);
  
  const {
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
  } = useGraphExploration();

  const handleExpandClick = () => {
    if (selectedNodes.length > 0) {
      expandVertex(selectedNodes[0], 1);
    }
  };

  const handleTraceClick = () => {
    if (selectedNodes.length === 2) {
      traceShortestPath(selectedNodes[0], selectedNodes[1]);
    } else {
      alert("Please select exactly two nodes (Shift+Click) to trace the shortest path.");
    }
  };

  return (
    <div className="bento-grid">
      
      {/* LEFT CONTROL PANEL */}
      <div className="glass-panel side-panel">
        <div className="panel-header">
          <Activity size={16} /> 
          Intelligence Controls
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
          <div className="stat-block">
            <span className="stat-label">Selected Entities</span>
            <span className="stat-value">{selectedNodes.length}</span>
            {selectedNodes.length > 0 && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                IDs: {selectedNodes.join(', ')}
              </span>
            )}
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <span className="stat-label">Exploration Actions</span>
            
            <button 
              className="glass-btn" 
              onClick={() => setMode('explore')}
              style={{ background: mode === 'explore' ? 'var(--accent-blue)' : '', color: mode === 'explore' ? 'var(--bg-dark)' : '' }}
            >
              <Network size={16} /> Standard Topology
            </button>
            
            <button 
              className="glass-btn" 
              onClick={handleExpandClick} 
              disabled={selectedNodes.length !== 1}
            >
              <Maximize2 size={16} /> Expand Neighborhood
            </button>
            
            <button 
              className="glass-btn" 
              onClick={handleTraceClick} 
              disabled={selectedNodes.length !== 2}
            >
              <GitCommit size={16} /> Trace Optimal Path
            </button>
            
            <button 
              className="glass-btn" 
              onClick={overlayCommunityDensity}
              style={{ background: mode === 'community' ? 'var(--accent-purple)' : '', color: mode === 'community' ? 'var(--bg-dark)' : '', borderColor: mode === 'community' ? 'var(--accent-purple)' : 'var(--accent-purple)' }}
            >
              <Search size={16} /> Run Louvain Modularity
            </button>
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
            <button className="glass-btn" style={{ flex: 1 }} onClick={() => exportGraph('png')}>
              <Download size={16} /> PNG
            </button>
            <button className="glass-btn" style={{ flex: 1 }} onClick={() => exportGraph('json')}>
              <Download size={16} /> JSON
            </button>
          </div>
        </div>
      </div>

      {/* CENTRAL GRAPH VIEWPORT */}
      <div className="glass-panel main-canvas">
        <div className="panel-header">
          <ShieldAlert size={16} style={{ color: 'var(--accent-red)' }}/> 
          Investigation Canvas
        </div>
        
        {/* Cytoscape renders here */}
        <NetworkCanvas elements={elements} bindCyInstance={bindCyInstance} />
        
        <div style={{ position: 'absolute', bottom: '1.25rem', right: '1.25rem', zIndex: 10, display: 'flex', gap: '0.5rem' }}>
          <div className="stat-block" style={{ flexDirection: 'row', alignItems: 'center', background: 'rgba(7, 9, 14, 0.7)', padding: '0.5rem 1rem', backdropFilter: 'blur(8px)' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-blue)', marginRight: '0.5rem' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Live Sync</span>
          </div>
        </div>
      </div>

      {/* BOTTOM TEMPORAL TIMELINE */}
      <div className="glass-panel timeline-panel">
        <div className="panel-header" style={{ marginBottom: '0.5rem' }}>
          <Clock size={16} /> 
          Temporal Playback
        </div>
        <div style={{ display: 'flex', alignItems: 'center', height: '100%', gap: '2rem' }}>
          
          <div style={{ flex: 1, position: 'relative' }}>
            {/* Native slider representing time - styled minimally */}
            <input 
              type="range" 
              min="0" 
              max="100" 
              defaultValue="100" 
              style={{ 
                width: '100%', 
                accentColor: 'var(--accent-blue)',
                height: '4px',
                background: 'rgba(255,255,255,0.1)',
                outline: 'none',
                borderRadius: '2px'
              }} 
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>T-WINDOW</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, fontFamily: 'monospace' }}>
              {new Date(filterState.startTime).toISOString().split('T')[0]} → {new Date(filterState.endTime).toISOString().split('T')[0]}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};

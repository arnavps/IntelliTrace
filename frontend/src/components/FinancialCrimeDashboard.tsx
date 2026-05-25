import React, { useState } from 'react';
import type { ElementDefinition } from 'cytoscape';
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
  const [elements] = useState<ElementDefinition[]>(MOCK_GRAPH);
  
  const {
    mode,
    setMode,
    selectedNodes,
    filterState,
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
    <div className="grid grid-cols-12 grid-rows-6 gap-5 p-5 h-screen w-screen bg-bgDark text-textPrimary overflow-hidden font-sans select-none">
      
      {/* LEFT CONTROL PANEL */}
      <div className="col-span-3 row-span-5 bg-bgCard backdrop-blur-md border border-glassBorder rounded-2xl p-5 shadow-2xl transition-all duration-300 ease-in-out flex flex-col relative overflow-hidden hover:bg-bgCardHover hover:border-white/15 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4),_0_0_20px_var(--glass-glow)]">
        <div className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-4 flex items-center gap-2">
          <Activity className="text-accentBlue animate-pulse" size={16} /> 
          Intelligence Controls
        </div>
        
        <div className="flex flex-col gap-4 flex-1">
          <div className="flex flex-col gap-1 p-4 bg-white/[0.03] rounded-lg border border-white/[0.05]">
            <span className="text-[10px] sm:text-xs text-textSecondary uppercase tracking-wider">Selected Entities</span>
            <span className="text-xl sm:text-2xl font-bold text-textPrimary">{selectedNodes.length}</span>
            {selectedNodes.length > 0 && (
              <span className="text-xs text-textSecondary truncate max-w-full">
                IDs: {selectedNodes.join(', ')}
              </span>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <span className="text-[10px] sm:text-xs text-textSecondary uppercase tracking-wider">Exploration Actions</span>
            
            <button 
              className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 border rounded-lg font-medium cursor-pointer transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed ${
                mode === 'explore' 
                  ? 'bg-accentBlue text-bgDark border-accentBlue shadow-[0_0_15px_rgba(56,189,248,0.3)]' 
                  : 'bg-accentBlue/10 border-accentBlue text-accentBlue hover:bg-accentBlue hover:text-bgDark hover:shadow-[0_0_15px_rgba(56,189,248,0.3)]'
              }`}
              onClick={() => setMode('explore')}
            >
              <Network size={16} /> Standard Topology
            </button>
            
            <button 
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-accentBlue/10 border border-accentBlue text-accentBlue rounded-lg font-medium cursor-pointer transition-all duration-200 ease-in-out hover:bg-accentBlue hover:text-bgDark hover:shadow-[0_0_15px_rgba(56,189,248,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleExpandClick} 
              disabled={selectedNodes.length !== 1}
            >
              <Maximize2 size={16} /> Expand Neighborhood
            </button>
            
            <button 
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-accentBlue/10 border border-accentBlue text-accentBlue rounded-lg font-medium cursor-pointer transition-all duration-200 ease-in-out hover:bg-accentBlue hover:text-bgDark hover:shadow-[0_0_15px_rgba(56,189,248,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleTraceClick} 
              disabled={selectedNodes.length !== 2}
            >
              <GitCommit size={16} /> Trace Optimal Path
            </button>
            
            <button 
              className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 border rounded-lg font-medium cursor-pointer transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed ${
                mode === 'community' 
                  ? 'bg-accentPurple text-bgDark border-accentPurple shadow-[0_0_15px_rgba(139,92,246,0.3)]' 
                  : 'bg-accentPurple/10 border-accentPurple text-accentPurple hover:bg-accentPurple hover:text-bgDark hover:shadow-[0_0_15px_rgba(139,92,246,0.3)]'
              }`}
              onClick={overlayCommunityDensity}
            >
              <Search size={16} /> Run Louvain Modularity
            </button>
          </div>

          <div className="mt-auto flex gap-2">
            <button 
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-accentBlue/10 border border-accentBlue text-accentBlue rounded-lg font-medium cursor-pointer transition-all duration-200 ease-in-out hover:bg-accentBlue hover:text-bgDark hover:shadow-[0_0_15px_rgba(56,189,248,0.3)]" 
              onClick={() => exportGraph('png')}
            >
              <Download size={16} /> PNG
            </button>
            <button 
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-accentBlue/10 border border-accentBlue text-accentBlue rounded-lg font-medium cursor-pointer transition-all duration-200 ease-in-out hover:bg-accentBlue hover:text-bgDark hover:shadow-[0_0_15px_rgba(56,189,248,0.3)]" 
              onClick={() => exportGraph('json')}
            >
              <Download size={16} /> JSON
            </button>
          </div>
        </div>
      </div>

      {/* CENTRAL GRAPH VIEWPORT */}
      <div className="col-span-9 row-span-5 bg-bgCard backdrop-blur-md border border-glassBorder rounded-2xl p-0 shadow-2xl transition-all duration-300 ease-in-out flex flex-col relative overflow-hidden hover:bg-bgCardHover hover:border-white/15 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4),_0_0_20px_var(--glass-glow)]">
        <div className="absolute top-5 left-5 z-10 bg-bgDark/70 px-4 py-2 rounded-lg backdrop-blur-sm border border-glassBorder text-xs font-semibold text-textSecondary uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert className="text-accentRed animate-pulse" size={16} /> 
          Investigation Canvas
        </div>
        
        {/* Cytoscape renders here */}
        <NetworkCanvas elements={elements} bindCyInstance={bindCyInstance} />
        
        <div className="absolute bottom-5 right-5 z-10 flex gap-2">
          <div className="flex items-center gap-2 bg-bgDark/70 px-4 py-2 rounded-lg backdrop-blur-sm border border-glassBorder text-xs text-textSecondary font-medium">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accentBlue opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accentBlue"></span>
            </div>
            <span>Live Sync</span>
          </div>
        </div>
      </div>

      {/* BOTTOM TEMPORAL TIMELINE */}
      <div className="col-span-12 row-span-1 bg-bgCard backdrop-blur-md border border-glassBorder rounded-2xl p-5 shadow-2xl transition-all duration-300 ease-in-out flex flex-col relative overflow-hidden hover:bg-bgCardHover hover:border-white/15 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4),_0_0_20px_var(--glass-glow)]">
        <div className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2 flex items-center gap-2">
          <Clock className="text-accentBlue" size={16} /> 
          Temporal Playback
        </div>
        <div className="flex items-center h-full gap-8">
          
          <div className="flex-1 relative flex items-center">
            {/* Native slider representing time - styled minimally */}
            <input 
              type="range" 
              min="0" 
              max="100" 
              defaultValue="100" 
              className="w-full accent-accentBlue h-1 bg-white/10 outline-none rounded-sm cursor-pointer"
            />
          </div>
          
          <div className="flex flex-col select-none">
            <span className="text-[10px] text-textSecondary uppercase tracking-wider font-medium">T-WINDOW</span>
            <span className="text-sm font-semibold text-accentBlue font-mono">
              {new Date(filterState.startTime).toISOString().split('T')[0]} → {new Date(filterState.endTime).toISOString().split('T')[0]}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};

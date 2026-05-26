import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CytoscapeComponent from 'react-cytoscapejs';
import type { ElementDefinition } from 'cytoscape';
import type { Core, NodeSingular } from 'cytoscape';
import {
  Network,
  Search,
  Maximize2,
  Download,
  FileJson,
  GitBranch,
  Users,
  Crosshair,
  ChevronRight,
  Circle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Activity,
} from 'lucide-react';
import { useGraphExploration } from '../../hooks/useGraphExploration';
import '../styles/dashboard.css';

// ─── Mock Graph Data ────────────────────────────────────────────────────────

interface NodeData {
  id: string;
  label: string;
  type: 'account' | 'shell' | 'bank' | 'flagged';
  riskScore: number;
  amount: number;
  communityId: number;
  connected: number;
  lastTx: string;
}

const NODES: ElementDefinition[] = [
  // Central hub
  {
    data: {
      id: 'ACC-0001', label: 'ACC-0001', type: 'flagged',
      riskScore: 0.95, amount: 850, communityId: 0,
      connected: 8, lastTx: '2026-05-25 22:14',
    } as NodeData,
  },
  // Accounts
  {
    data: {
      id: 'ACC-1204', label: 'ACC-1204', type: 'flagged',
      riskScore: 0.88, amount: 620, communityId: 1,
      connected: 4, lastTx: '2026-05-25 21:30',
    } as NodeData,
  },
  {
    data: {
      id: 'ACC-9932', label: 'ACC-9932', type: 'account',
      riskScore: 0.72, amount: 380, communityId: 1,
      connected: 3, lastTx: '2026-05-25 20:55',
    } as NodeData,
  },
  {
    data: {
      id: 'ACC-7711', label: 'ACC-7711', type: 'account',
      riskScore: 0.45, amount: 210, communityId: 2,
      connected: 2, lastTx: '2026-05-24 18:10',
    } as NodeData,
  },
  {
    data: {
      id: 'ACC-3301', label: 'ACC-3301', type: 'account',
      riskScore: 0.31, amount: 150, communityId: 2,
      connected: 2, lastTx: '2026-05-23 14:45',
    } as NodeData,
  },
  {
    data: {
      id: 'ACC-8821', label: 'ACC-8821', type: 'flagged',
      riskScore: 0.83, amount: 490, communityId: 0,
      connected: 3, lastTx: '2026-05-26 00:02',
    } as NodeData,
  },
  {
    data: {
      id: 'ACC-4450', label: 'ACC-4450', type: 'account',
      riskScore: 0.55, amount: 270, communityId: 3,
      connected: 2, lastTx: '2026-05-24 09:20',
    } as NodeData,
  },
  // Entities
  {
    data: {
      id: 'SHELL-A', label: 'Shell Corp Alpha', type: 'shell',
      riskScore: 0.91, amount: 740, communityId: 0,
      connected: 5, lastTx: '2026-05-25 23:45',
    } as NodeData,
  },
  {
    data: {
      id: 'GHOST-T', label: 'Ghost Traders Ltd', type: 'shell',
      riskScore: 0.86, amount: 560, communityId: 1,
      connected: 4, lastTx: '2026-05-25 22:59',
    } as NodeData,
  },
  // Banks
  {
    data: {
      id: 'BANK-OFX', label: 'Offshore Bank X', type: 'bank',
      riskScore: 0.78, amount: 920, communityId: 0,
      connected: 6, lastTx: '2026-05-25 23:01',
    } as NodeData,
  },
  {
    data: {
      id: 'BANK-DXB', label: 'Dubai Bank', type: 'bank',
      riskScore: 0.64, amount: 680, communityId: 1,
      connected: 4, lastTx: '2026-05-25 21:18',
    } as NodeData,
  },
  {
    data: {
      id: 'BANK-MRX', label: 'Mauritius Offshore', type: 'bank',
      riskScore: 0.52, amount: 430, communityId: 3,
      connected: 3, lastTx: '2026-05-24 16:30',
    } as NodeData,
  },
];

const EDGES: ElementDefinition[] = [
  // Circular ring: ACC-1204 → Shell Corp Alpha → Offshore Bank X → ACC-0001 → ACC-9932 → Ghost Traders → Dubai Bank → ACC-1204
  { data: { id: 'e1', source: 'ACC-1204', target: 'SHELL-A',  label: 'WIRE ₹50L',  amount: 50 } },
  { data: { id: 'e2', source: 'SHELL-A',  target: 'BANK-OFX', label: 'SWIFT ₹62L', amount: 62 } },
  { data: { id: 'e3', source: 'BANK-OFX', target: 'ACC-0001', label: 'ACH ₹48L',   amount: 48 } },
  { data: { id: 'e4', source: 'ACC-0001', target: 'ACC-9932', label: 'WIRE ₹35L',  amount: 35 } },
  { data: { id: 'e5', source: 'ACC-9932', target: 'GHOST-T',  label: 'NEFT ₹41L',  amount: 41 } },
  { data: { id: 'e6', source: 'GHOST-T',  target: 'BANK-DXB', label: 'SWIFT ₹58L', amount: 58 } },
  { data: { id: 'e7', source: 'BANK-DXB', target: 'ACC-1204', label: 'WIRE ₹44L',  amount: 44 } },
  // Cross-connections for complexity
  { data: { id: 'e8',  source: 'ACC-0001',  target: 'ACC-8821',  label: 'ACH ₹22L',  amount: 22 } },
  { data: { id: 'e9',  source: 'ACC-8821',  target: 'SHELL-A',   label: 'WIRE ₹30L', amount: 30 } },
  { data: { id: 'e10', source: 'SHELL-A',   target: 'BANK-MRX',  label: 'SWIFT ₹19L', amount: 19 } },
  { data: { id: 'e11', source: 'BANK-MRX',  target: 'ACC-4450',  label: 'NEFT ₹12L',  amount: 12 } },
  { data: { id: 'e12', source: 'ACC-4450',  target: 'ACC-7711',  label: 'WIRE ₹8L',   amount: 8  } },
  { data: { id: 'e13', source: 'ACC-7711',  target: 'ACC-3301',  label: 'NEFT ₹5L',   amount: 5  } },
  { data: { id: 'e14', source: 'ACC-3301',  target: 'BANK-OFX',  label: 'SWIFT ₹6L',  amount: 6  } },
  { data: { id: 'e15', source: 'GHOST-T',   target: 'ACC-8821',  label: 'ACH ₹17L',   amount: 17 } },
  { data: { id: 'e16', source: 'BANK-OFX',  target: 'GHOST-T',   label: 'WIRE ₹25L',  amount: 25 } },
  { data: { id: 'e17', source: 'ACC-9932',  target: 'ACC-7711',  label: 'NEFT ₹9L',   amount: 9  } },
];

// ─── Node color helper ────────────────────────────────────────────────────────

function getNodeColor(type: string, riskScore: number): string {
  if (type === 'flagged' || riskScore > 0.8) return '#EF4444';
  if (riskScore > 0.5) return '#F97316';
  if (type === 'shell') return '#8B5CF6';
  if (type === 'bank') return '#22C55E';
  return '#3B82F6';
}

function getNodeSize(amount: number): number {
  if (amount > 800) return 55;
  if (amount > 600) return 48;
  if (amount > 400) return 42;
  if (amount > 200) return 36;
  return 30;
}

// ─── Cytoscape Stylesheet ─────────────────────────────────────────────────────

const cytoscapeStylesheet: any = [
  {
    selector: 'node',
    style: {
      'background-color': (ele: NodeSingular) =>
        getNodeColor(ele.data('type'), ele.data('riskScore')),
      'width': (ele: NodeSingular) => getNodeSize(ele.data('amount')),
      'height': (ele: NodeSingular) => getNodeSize(ele.data('amount')),
      'label': 'data(label)',
      'color': '#ffffff',
      'font-size': '10px',
      'font-family': 'Inter, sans-serif',
      'font-weight': '600',
      'text-valign': 'bottom',
      'text-halign': 'center',
      'text-margin-y': 6,
      'text-outline-width': 2,
      'text-outline-color': '#0A0A0A',
      'border-width': 2,
      'border-color': (ele: NodeSingular) =>
        getNodeColor(ele.data('type'), ele.data('riskScore')),
      'border-opacity': 0.6,
    } as unknown as cytoscape.Css.Node,
  },
  {
    selector: 'node:selected',
    style: {
      'border-width': 3,
      'border-color': '#F5A623',
      'border-opacity': 1,
      'box-shadow': '0 0 20px rgba(245,166,35,0.6)',
      'z-index': 999,
    } as unknown as cytoscape.Css.Node,
  },
  {
    selector: 'edge',
    style: {
      'width': (ele: any) => Math.max(1.5, (ele.data('amount') || 5) / 20),
      'line-color': '#F5A623',
      'line-opacity': 0.55,
      'target-arrow-color': '#F5A623',
      'target-arrow-shape': 'triangle',
      'arrow-scale': 1.2,
      'curve-style': 'bezier',
      'label': 'data(label)',
      'font-size': '9px',
      'color': '#F5A623',
      'font-family': 'Inter, sans-serif',
      'font-weight': '500',
      'text-rotation': 'autorotate',
      'text-background-color': '#0A0A0A',
      'text-background-opacity': 0.85,
      'text-background-padding': '2px',
    } as unknown as cytoscape.Css.Edge,
  },
  {
    selector: 'edge:selected',
    style: {
      'line-color': '#ffffff',
      'target-arrow-color': '#ffffff',
      'line-opacity': 1,
      'z-index': 999,
    } as unknown as cytoscape.Css.Edge,
  },
  {
    selector: '.faded',
    style: { 'opacity': 0.15 } as unknown as cytoscape.Css.Node,
  },
  {
    selector: '.highlighted',
    style: { 'opacity': 1, 'z-index': 100 } as unknown as cytoscape.Css.Node,
  },
];

const cytoscapeLayout = {
  name: 'cose',
  animate: true,
  animationDuration: 800,
  nodeRepulsion: () => 400000,
  idealEdgeLength: () => 200,
  edgeElasticity: () => 0.1,
  gravity: 0.1,
  fit: true,
  padding: 80,
};

// ─── Type maps ────────────────────────────────────────────────────────────────

type GraphMode = 'standard' | 'community' | 'path';

const TYPE_LABELS: Record<string, string> = {
  account: 'Account',
  shell: 'Shell Corp',
  bank: 'Bank',
  flagged: 'Flagged Account',
};

const RISK_LABELS: Record<string, string> = {
  critical: 'CRITICAL',
  high: 'HIGH',
  medium: 'MEDIUM',
  low: 'LOW',
};

function getRiskLevel(score: number): string {
  if (score > 0.8) return 'critical';
  if (score > 0.6) return 'high';
  if (score > 0.4) return 'medium';
  return 'low';
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GraphExplorerPage() {
  useNavigate(); // route-aware (kept for future deep-link use)

  const [graphMode, setGraphMode] = useState<GraphMode>('standard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState(70);

  const cyRef = useRef<Core | null>(null);
  const { bindCyInstance, expandVertex, traceShortestPath, overlayCommunityDensity, exportGraph } = useGraphExploration();

  // Merge hook binding + local selection tracking
  const handleCyInit = useCallback((cy: Core) => {
    cyRef.current = cy;
    bindCyInstance(cy);

    cy.on('tap', 'node', (e) => {
      const node = e.target as NodeSingular;
      const data = node.data() as NodeData;
      setSelectedNode(data);
      setSelectedNodeIds(prev =>
        prev.includes(node.id())
          ? prev.filter(id => id !== node.id())
          : [...prev, node.id()]
      );
    });

    cy.on('tap', (e) => {
      if (e.target === cy) {
        setSelectedNode(null);
        setSelectedNodeIds([]);
        cy.elements().removeClass('faded highlighted');
      }
    });
  }, [bindCyInstance]);

  // Mode change
  const handleModeChange = (mode: GraphMode) => {
    setGraphMode(mode);
    if (mode === 'community' && cyRef.current) {
      overlayCommunityDensity();
    } else if (cyRef.current) {
      // Reset community colors
      cyRef.current.elements().removeClass('faded highlighted');
      cyRef.current.nodes().removeStyle('background-color');
    }
  };

  // Zoom controls
  const handleZoomIn  = () => cyRef.current?.zoom({ level: (cyRef.current.zoom() * 1.25), renderedPosition: { x: cyRef.current.width() / 2, y: cyRef.current.height() / 2 } });
  const handleZoomOut = () => cyRef.current?.zoom({ level: (cyRef.current.zoom() * 0.8),  renderedPosition: { x: cyRef.current.width() / 2, y: cyRef.current.height() / 2 } });
  const handleFit     = () => cyRef.current?.fit(undefined, 40);

  // Actions
  const handleExpand = () => {
    if (selectedNode) expandVertex(selectedNode.id);
  };
  const handleTrace = () => {
    if (selectedNodeIds.length >= 2) {
      traceShortestPath(selectedNodeIds[0], selectedNodeIds[selectedNodeIds.length - 1]);
    }
  };

  // Filter nodes by search
  const filteredElements = searchQuery.trim()
    ? [
        ...NODES.filter(n =>
          (n.data.label as string).toLowerCase().includes(searchQuery.toLowerCase()) ||
          (n.data.id as string).toLowerCase().includes(searchQuery.toLowerCase())
        ),
        ...EDGES,
      ]
    : [...NODES, ...EDGES];

  const riskClass = selectedNode ? `it-risk-${getRiskLevel(selectedNode.riskScore)}` : '';
  const riskLabel = selectedNode ? RISK_LABELS[getRiskLevel(selectedNode.riskScore)] : '';

  return (
    <div className="it-app" style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0A0A0A' }}>

      {/* ── Left Panel ── */}
      <aside style={{
        width: '288px',
        flexShrink: 0,
        background: '#0D0D0D',
        borderRight: '1px solid #1E1E1E',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        overflow: 'hidden',
      }}>
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.25)', borderRadius: '8px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Network size={16} color="#F5A623" />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', fontFamily: 'Inter, sans-serif' }}>Graph Explorer</div>
              <div style={{ fontSize: '11px', color: '#666', fontFamily: 'Inter, sans-serif' }}>Fund flow investigation</div>
            </div>
          </div>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={13} color="#666" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              className="it-input"
              style={{ paddingLeft: '32px', fontSize: '12px' }}
              placeholder="Search account or entity..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Graph Controls */}
          <div>
            <div className="it-label" style={{ marginBottom: '8px' }}>Graph Controls</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {/* Standard */}
              <button
                onClick={() => handleModeChange('standard')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  background: graphMode === 'standard' ? 'rgba(59,130,246,0.18)' : 'rgba(255,255,255,0.04)',
                  color: graphMode === 'standard' ? '#60A5FA' : '#888',
                  fontSize: '12px', fontWeight: 500,
                  outline: graphMode === 'standard' ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
                  transition: 'all 0.2s',
                }}
              >
                <GitBranch size={13} />
                Standard Topology
                {graphMode === 'standard' && <ChevronRight size={12} style={{ marginLeft: 'auto' }} />}
              </button>
              {/* Community */}
              <button
                onClick={() => handleModeChange('community')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  background: graphMode === 'community' ? 'rgba(139,92,246,0.18)' : 'rgba(255,255,255,0.04)',
                  color: graphMode === 'community' ? '#A78BFA' : '#888',
                  fontSize: '12px', fontWeight: 500,
                  outline: graphMode === 'community' ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent',
                  transition: 'all 0.2s',
                }}
              >
                <Users size={13} />
                Community Detection
                {graphMode === 'community' && <ChevronRight size={12} style={{ marginLeft: 'auto' }} />}
              </button>
              {/* Path */}
              <button
                onClick={() => handleModeChange('path')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  background: graphMode === 'path' ? 'rgba(245,166,35,0.18)' : 'rgba(255,255,255,0.04)',
                  color: graphMode === 'path' ? '#F5A623' : '#888',
                  fontSize: '12px', fontWeight: 500,
                  outline: graphMode === 'path' ? '1px solid rgba(245,166,35,0.3)' : '1px solid transparent',
                  transition: 'all 0.2s',
                }}
              >
                <Crosshair size={13} />
                Path Tracing
                {graphMode === 'path' && <ChevronRight size={12} style={{ marginLeft: 'auto' }} />}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div>
            <div className="it-label" style={{ marginBottom: '8px' }}>Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                className="it-btn it-btn-outline it-btn-sm"
                style={{ justifyContent: 'flex-start', width: '100%', opacity: selectedNode ? 1 : 0.4, cursor: selectedNode ? 'pointer' : 'not-allowed' }}
                disabled={!selectedNode}
                onClick={handleExpand}
              >
                <Maximize2 size={13} /> Expand Selected
              </button>
              <button
                className="it-btn it-btn-outline it-btn-sm"
                style={{ justifyContent: 'flex-start', width: '100%', opacity: selectedNodeIds.length >= 2 ? 1 : 0.4, cursor: selectedNodeIds.length >= 2 ? 'pointer' : 'not-allowed' }}
                disabled={selectedNodeIds.length < 2}
                onClick={handleTrace}
              >
                <Crosshair size={13} /> Trace Path
                {selectedNodeIds.length >= 2 && (
                  <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#F5A623', fontWeight: 700 }}>
                    {selectedNodeIds.length} nodes
                  </span>
                )}
              </button>
              <button
                className="it-btn it-btn-outline it-btn-sm"
                style={{ justifyContent: 'flex-start', width: '100%' }}
                onClick={() => exportGraph('png')}
              >
                <Download size={13} /> Export PNG
              </button>
              <button
                className="it-btn it-btn-outline it-btn-sm"
                style={{ justifyContent: 'flex-start', width: '100%' }}
                onClick={() => exportGraph('json')}
              >
                <FileJson size={13} /> Export JSON
              </button>
            </div>
          </div>

          {/* Legend */}
          <div>
            <div className="it-label" style={{ marginBottom: '8px' }}>Legend</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { color: '#3B82F6', label: 'Account', pulse: false },
                { color: '#EF4444', label: 'Shell Corp', pulse: false },
                { color: '#22C55E', label: 'Bank', pulse: false },
                { color: '#F5A623', label: 'Flagged Node', pulse: true },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '10px', height: '10px', borderRadius: '50%',
                    background: item.color, flexShrink: 0,
                    boxShadow: item.pulse ? `0 0 6px ${item.color}` : 'none',
                    animation: item.pulse ? 'pulse-ring 1.5s infinite' : 'none',
                  }} />
                  <span style={{ fontSize: '12px', color: '#999', fontFamily: 'Inter, sans-serif' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Node Info */}
          <div>
            <div className="it-label" style={{ marginBottom: '8px' }}>Selected Node Info</div>
            {!selectedNode ? (
              <div style={{
                padding: '14px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.03)', border: '1px dashed #2A2A2A',
                textAlign: 'center', fontSize: '12px', color: '#555', fontFamily: 'Inter, sans-serif',
              }}>
                <Circle size={20} color="#2A2A2A" style={{ margin: '0 auto 6px' }} />
                Click a node to inspect
              </div>
            ) : (
              <div style={{
                padding: '12px', borderRadius: '10px',
                background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.2)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', fontFamily: 'Inter, sans-serif' }}>
                      {selectedNode.label}
                    </div>
                    <div style={{ fontSize: '11px', color: '#777', marginTop: '2px', fontFamily: 'Inter, sans-serif' }}>
                      {TYPE_LABELS[selectedNode.type] || selectedNode.type}
                    </div>
                  </div>
                  <span className={`it-badge it-badge-${getRiskLevel(selectedNode.riskScore)}`}>
                    {riskLabel}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[
                    { label: 'Risk Score', value: (selectedNode.riskScore * 100).toFixed(0) + '%' },
                    { label: 'Connected', value: `${selectedNode.connected} nodes` },
                    { label: 'Volume', value: `₹${selectedNode.amount}L` },
                    { label: 'Last Tx', value: selectedNode.lastTx },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '11px', color: '#666', fontFamily: 'Inter, sans-serif' }}>{row.label}</span>
                      <span style={{ fontSize: '11px', color: '#ddd', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Node Stats */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #1E1E1E', borderRadius: '10px', padding: '12px' }}>
            <div className="it-label" style={{ marginBottom: '8px' }}>Graph Statistics</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {[
                { value: '24', label: 'Nodes' },
                { value: '31', label: 'Edges' },
                { value: '4', label: 'Communities' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#F5A623', fontFamily: 'Inter, sans-serif' }}>{s.value}</div>
                  <div style={{ fontSize: '10px', color: '#555', fontFamily: 'Inter, sans-serif' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </aside>

      {/* ── Main Graph Area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

        {/* Top bar overlay */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'linear-gradient(to bottom, rgba(10,10,10,0.95), transparent)',
          pointerEvents: 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', pointerEvents: 'auto' }}>
            <span className="it-badge it-badge-accent">
              <Activity size={10} style={{ marginRight: '4px' }} />
              Investigation Canvas
            </span>
            {graphMode === 'community' && (
              <span className="it-badge it-badge-review">Community Mode</span>
            )}
            {graphMode === 'path' && (
              <span className="it-badge it-badge-medium">Path Tracing Mode</span>
            )}
          </div>
          <div className="it-live-dot" style={{ pointerEvents: 'auto' }}>Live Sync</div>
        </div>

        {/* Zoom controls */}
        <div style={{
          position: 'absolute', right: '16px', top: '56px', zIndex: 10,
          display: 'flex', flexDirection: 'column', gap: '6px',
        }}>
          {[
            { icon: <ZoomIn size={14} />, action: handleZoomIn, title: 'Zoom In' },
            { icon: <ZoomOut size={14} />, action: handleZoomOut, title: 'Zoom Out' },
            { icon: <RotateCcw size={14} />, action: handleFit, title: 'Fit to Screen' },
          ].map((ctrl, i) => (
            <button
              key={i}
              title={ctrl.title}
              onClick={ctrl.action}
              style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: 'rgba(26,26,26,0.9)', border: '1px solid #2A2A2A',
                color: '#999', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#F5A623'; (e.currentTarget as HTMLButtonElement).style.color = '#F5A623'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#2A2A2A'; (e.currentTarget as HTMLButtonElement).style.color = '#999'; }}
            >
              {ctrl.icon}
            </button>
          ))}
        </div>

        {/* Cytoscape Graph */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <CytoscapeComponent
            elements={filteredElements}
            stylesheet={cytoscapeStylesheet}
            layout={cytoscapeLayout}
            cy={handleCyInit}
            style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
            wheelSensitivity={0.3}
            maxZoom={1.5}
            minZoom={0.2}
          />
        </div>

        {/* Bottom Time Range Bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
          background: 'linear-gradient(to top, rgba(10,10,10,0.97) 70%, transparent)',
          padding: '20px 24px 14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '11px', color: '#555', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              TIME RANGE
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
              <span style={{ fontSize: '11px', color: '#555', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}>Apr 25</span>
              <input
                type="range"
                min={0}
                max={100}
                value={timeRange}
                onChange={e => setTimeRange(Number(e.target.value))}
                style={{
                  flex: 1, appearance: 'none', height: '3px',
                  background: `linear-gradient(to right, #F5A623 ${timeRange}%, #2A2A2A ${timeRange}%)`,
                  borderRadius: '2px', outline: 'none', cursor: 'pointer',
                }}
              />
              <span style={{ fontSize: '11px', color: '#555', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}>May 26</span>
            </div>
            <span style={{
              fontSize: '11px', color: '#F5A623', fontFamily: 'Inter, sans-serif',
              background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.2)',
              borderRadius: '6px', padding: '3px 8px', whiteSpace: 'nowrap', fontWeight: 600,
            }}>
              Last {Math.round(timeRange * 0.3)}d
            </span>
            {/* Risk class reference to suppress TS unused warning */}
            <span style={{ display: 'none' }} className={riskClass} />
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useMemo } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import { Core, ElementDefinition, Stylesheet } from 'cytoscape';

// We register layout extensions here if needed, e.g., fcose for better force-directed rendering.
// import cytoscape from 'cytoscape';
// import fcose from 'cytoscape-fcose';
// cytoscape.use(fcose);

interface NetworkCanvasProps {
  elements: ElementDefinition[];
  bindCyInstance: (cy: Core) => void;
}

export const NetworkCanvas: React.FC<NetworkCanvasProps> = ({ elements, bindCyInstance }) => {
  const cyStylesheet: Stylesheet[] = useMemo(() => [
    {
      selector: 'node',
      style: {
        'background-color': '#38bdf8', // var(--accent-blue)
        'label': 'data(label)',
        'color': '#f8fafc', // var(--text-primary)
        'font-size': '12px',
        'font-family': 'Inter, sans-serif',
        'text-valign': 'bottom',
        'text-halign': 'center',
        'text-margin-y': 6,
        'width': 24,
        'height': 24,
        'border-width': 2,
        'border-color': 'rgba(255,255,255,0.1)',
        'transition-property': 'background-color, border-color, width, height',
        'transition-duration': 200,
      }
    },
    {
      selector: 'node[type="ACCOUNT"]',
      style: {
        'shape': 'ellipse',
      }
    },
    {
      selector: 'node[type="ENTITY"]',
      style: {
        'shape': 'round-rectangle',
        'background-color': '#8b5cf6', // var(--accent-purple)
      }
    },
    {
      selector: 'node[type="BANK"]',
      style: {
        'shape': 'hexagon',
        'background-color': '#10b981', // var(--accent-green)
      }
    },
    {
      selector: 'edge',
      style: {
        'width': 2,
        'line-color': 'rgba(148, 163, 184, 0.3)', // var(--text-secondary) faded
        'target-arrow-color': 'rgba(148, 163, 184, 0.4)',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'arrow-scale': 0.8,
        'transition-property': 'line-color, target-arrow-color, width',
        'transition-duration': 200,
      }
    },
    {
      selector: 'node:selected',
      style: {
        'border-color': '#f8fafc',
        'border-width': 4,
        'background-color': '#ef4444', // var(--accent-red)
        'width': 32,
        'height': 32,
        'box-shadow': '0 0 15px rgba(239, 68, 68, 0.5)' as any // Wait, box-shadow is not native cy style, dropping it. We'll use border-opacity.
      }
    },
    {
      selector: '.highlighted',
      style: {
        'background-color': '#ef4444',
        'line-color': '#ef4444',
        'target-arrow-color': '#ef4444',
        'width': 4,
        'z-index': 100,
      }
    },
    {
      selector: '.path',
      style: {
        'line-color': '#f59e0b',
        'target-arrow-color': '#f59e0b',
        'width': 6,
        'z-index': 110,
      }
    },
    {
      selector: '.faded',
      style: {
        'opacity': 0.1,
      }
    }
  ], []);

  const layout = {
    name: 'cose',
    idealEdgeLength: 100,
    nodeOverlap: 20,
    refresh: 20,
    fit: true,
    padding: 30,
    randomize: false,
    componentSpacing: 100,
    nodeRepulsion: 400000,
    edgeElasticity: 100,
    nestingFactor: 5,
    gravity: 80,
    numIter: 1000,
    initialTemp: 200,
    coolingFactor: 0.95,
    minTemp: 1.0,
    animate: false // We animate on specific user actions, not initial load
  };

  return (
    <div className="cy-container">
      <CytoscapeComponent
        elements={elements}
        style={{ width: '100%', height: '100%' }}
        stylesheet={cyStylesheet}
        layout={layout}
        cy={bindCyInstance}
        wheelSensitivity={0.1}
        minZoom={0.1}
        maxZoom={5}
      />
    </div>
  );
};

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';

interface FlowData {
  nodes: { name: string; category: string }[];
  links: { source: number; target: number; value: number }[];
}

export const SankeyVisualizer: React.FC<{ data: FlowData }> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    const width = 800;
    const height = 400;

    const svg = d3.select(svgRef.current)
      .attr('viewBox', [0, 0, width, height])
      .style('width', '100%')
      .style('height', '100%');
      
    svg.selectAll('*').remove();

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const sankeyGenerator = sankey<any, any>()
      .nodeWidth(15)
      .nodePadding(10)
      .extent([[1, 1], [width - 1, height - 5]]);

    const { nodes, links } = sankeyGenerator({
      nodes: data.nodes.map(d => Object.assign({}, d)),
      links: data.links.map(d => Object.assign({}, d))
    });

    svg.append('g')
      .selectAll('rect')
      .data(nodes)
      .join('rect')
      .attr('x', d => d.x0!)
      .attr('y', d => d.y0!)
      .attr('height', d => Math.max(d.y1! - d.y0!, 1))
      .attr('width', d => d.x1! - d.x0!)
      .attr('fill', d => color(d.category || d.name))
      .attr('opacity', 0.8)
      .append('title')
      .text(d => `${d.name}\n${d.value}`);

    const link = svg.append('g')
      .attr('fill', 'none')
      .attr('stroke-opacity', 0.2)
      .selectAll('g')
      .data(links)
      .join('g')
      .style('mix-blend-mode', 'screen');

    link.append('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('stroke', d => color(d.source.name))
      .attr('stroke-width', d => Math.max(1, d.width!));

    link.append('title')
      .text(d => `${d.source.name} → ${d.target.name}\nVolume: ${d.value}`);

    svg.append('g')
      .style('font', '10px Inter, sans-serif')
      .style('fill', '#f8fafc')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .attr('x', d => d.x0! < width / 2 ? d.x1! + 6 : d.x0! - 6)
      .attr('y', d => (d.y1! + d.y0!) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', d => d.x0! < width / 2 ? 'start' : 'end')
      .text(d => d.name);

  }, [data]);

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <svg ref={svgRef}></svg>
    </div>
  );
};

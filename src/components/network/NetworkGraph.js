// Network Graph - Interactive D3 force-directed visualization of model connections
// Draggable nodes, animated particles, click-to-expand, smooth zoom/pan
import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import { Network as NetworkIcon, ZoomIn, ZoomOut, Maximize2, Play, Pause, MousePointer, Move } from 'lucide-react';
import { getModelConfig } from '../../config/modelConfig';

const NetworkGraph = ({ connectionData, networkMetrics }) => {
  const svgRef = useRef(null);
  const simulationRef = useRef(null);
  const particlesRef = useRef(null);
  const [animating, setAnimating] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [tooltipData, setTooltipData] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const width = 900;
  const height = 700;

  const buildGraphData = useCallback(() => {
    if (!connectionData || !connectionData.connections) return { nodes: [], links: [] };

    const { connections, models } = connectionData;
    const nodes = [];
    const links = [];

    const maxConnections = networkMetrics?.metrics
      ? Math.max(...Object.values(networkMetrics.metrics).map(m => m.totalConnections), 1)
      : 1;

    models.forEach(model => {
      const config = getModelConfig(model);
      const metrics = networkMetrics?.metrics?.[model];
      const normalized = metrics ? metrics.totalConnections / maxConnections : 0;
      nodes.push({
        id: model,
        color: config?.color || '#8B5CF6',
        domain: config?.domain || '',
        totalConnections: metrics?.totalConnections || 0,
        connectedModelsCount: metrics?.connectedModelsCount || 0,
        totalPapers: metrics?.totalPapers || 0,
        radius: 22 + normalized * 28,
      });
    });

    const maxStrength = Math.max(...connections.map(c => c.strength), 1);
    connections.forEach(conn => {
      links.push({
        source: conn.source,
        target: conn.target,
        value: conn.strength,
        strength: conn.strength / maxStrength,
        sharedPapers: conn.sharedPapers || [],
        sharedAuthors: conn.sharedAuthors || [],
        sharedDomains: conn.sharedDomains || [],
      });
    });

    return { nodes, links };
  }, [connectionData, networkMetrics]);

  // Main D3 rendering
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { nodes, links } = buildGraphData();
    if (nodes.length === 0) return;

    // Main group for zoom/pan
    const g = svg.append('g').attr('class', 'main-group');

    // Zoom behavior
    const zoomBehavior = d3.zoom()
      .scaleExtent([0.3, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    svg.call(zoomBehavior);

    // Initial centering
    svg.call(zoomBehavior.transform,
      d3.zoomIdentity.translate(width / 2, height / 2).scale(0.85).translate(-width / 2, -height / 2)
    );

    svgRef.current._zoomBehavior = zoomBehavior;

    // Defs for gradients and filters
    const defs = svg.append('defs');

    // Glow filter
    const glowFilter = defs.append('filter').attr('id', 'net-glow');
    glowFilter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const feMerge = glowFilter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Edge gradients
    links.forEach((link, i) => {
      const sourceNode = nodes.find(n => n.id === (link.source.id || link.source));
      const targetNode = nodes.find(n => n.id === (link.target.id || link.target));
      if (!sourceNode || !targetNode) return;

      const gradient = defs.append('linearGradient')
        .attr('id', `net-edge-gradient-${i}`)
        .attr('gradientUnits', 'userSpaceOnUse');
      gradient.append('stop').attr('offset', '0%').attr('stop-color', sourceNode.color).attr('stop-opacity', 0.6);
      gradient.append('stop').attr('offset', '100%').attr('stop-color', targetNode.color).attr('stop-opacity', 0.6);
    });

    // Force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id)
        .distance(d => 180 - d.strength * 50)
        .strength(d => 0.3 + d.strength * 0.4))
      .force('charge', d3.forceManyBody().strength(-600))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => d.radius + 20))
      .force('x', d3.forceX(width / 2).strength(0.05))
      .force('y', d3.forceY(height / 2).strength(0.05));

    simulationRef.current = simulation;

    // Background ambient circles
    const bgGroup = g.append('g').attr('class', 'background');
    bgGroup.append('circle')
      .attr('cx', width / 2).attr('cy', height / 2).attr('r', 280)
      .attr('fill', 'none').attr('stroke', '#E2E8F0').attr('stroke-width', 1)
      .attr('stroke-dasharray', '6 4').attr('opacity', 0.5);
    bgGroup.append('circle')
      .attr('cx', width / 2).attr('cy', height / 2).attr('r', 180)
      .attr('fill', 'none').attr('stroke', '#E2E8F0').attr('stroke-width', 1)
      .attr('stroke-dasharray', '6 4').attr('opacity', 0.3);

    // Center label
    bgGroup.append('text')
      .attr('x', width / 2).attr('y', height / 2 - 6)
      .attr('text-anchor', 'middle').attr('fill', '#CBD5E1')
      .attr('font-size', '12px').attr('font-weight', '600')
      .text('Model');
    bgGroup.append('text')
      .attr('x', width / 2).attr('y', height / 2 + 10)
      .attr('text-anchor', 'middle').attr('fill', '#CBD5E1')
      .attr('font-size', '12px').attr('font-weight', '600')
      .text('Network');

    // Draw links
    const linkGroup = g.append('g').attr('class', 'links');
    const linkElements = linkGroup.selectAll('path')
      .data(links)
      .enter()
      .append('path')
      .attr('fill', 'none')
      .attr('stroke', (d, i) => `url(#net-edge-gradient-${i})`)
      .attr('stroke-width', d => 2 + d.strength * 10)
      .attr('stroke-opacity', d => 0.2 + d.strength * 0.5)
      .attr('stroke-linecap', 'round')
      .style('cursor', 'pointer')
      .on('mouseenter', function(event, d) {
        d3.select(this)
          .transition().duration(200)
          .attr('stroke-opacity', 0.9)
          .attr('stroke-width', d => 4 + d.strength * 12);
        setTooltipData({
          type: 'link',
          source: d.source.id || d.source,
          target: d.target.id || d.target,
          value: d.value,
          sharedDomains: d.sharedDomains,
        });
        setTooltipPos({ x: event.offsetX, y: event.offsetY });
      })
      .on('mouseleave', function(event, d) {
        d3.select(this)
          .transition().duration(200)
          .attr('stroke-opacity', d => 0.2 + d.strength * 0.5)
          .attr('stroke-width', d => 2 + d.strength * 10);
        setTooltipData(null);
      });

    // Animated particles along edges
    const particleGroup = g.append('g').attr('class', 'particles');
    particlesRef.current = particleGroup;

    // Draw nodes
    const nodeGroup = g.append('g').attr('class', 'nodes');
    const nodeElements = nodeGroup.selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .style('cursor', 'grab')
      .call(d3.drag()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
          d3.select(event.sourceEvent.target.closest('g')).style('cursor', 'grabbing');
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
          d3.select(event.sourceEvent.target.closest('g')).style('cursor', 'grab');
        })
      );

    // Node pulse ring (animated)
    nodeElements.append('circle')
      .attr('class', 'pulse-ring')
      .attr('r', d => d.radius)
      .attr('fill', 'none')
      .attr('stroke', d => d.color)
      .attr('stroke-width', 2)
      .attr('opacity', 0);

    // Node outer glow
    nodeElements.append('circle')
      .attr('class', 'node-glow')
      .attr('r', d => d.radius + 8)
      .attr('fill', d => d.color)
      .attr('opacity', 0)
      .attr('filter', 'url(#net-glow)');

    // Main node circle
    nodeElements.append('circle')
      .attr('class', 'node-main')
      .attr('r', d => d.radius)
      .attr('fill', d => d.color)
      .attr('stroke', 'white')
      .attr('stroke-width', 3)
      .style('filter', 'url(#net-glow)');

    // Inner highlight
    nodeElements.append('circle')
      .attr('r', d => d.radius * 0.6)
      .attr('fill', 'white')
      .attr('opacity', 0.15);

    // Connection count inside nodes
    nodeElements.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '13px')
      .attr('font-weight', '700')
      .text(d => d.totalConnections);

    // Node label
    nodeElements.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', d => d.radius + 18)
      .attr('fill', '#1E293B')
      .attr('font-size', '12px')
      .attr('font-weight', '700')
      .text(d => d.id);

    // Sub-label
    nodeElements.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', d => d.radius + 32)
      .attr('fill', '#94A3B8')
      .attr('font-size', '10px')
      .text(d => `${d.totalPapers.toLocaleString()} papers`);

    // Hover effects
    nodeElements
      .on('mouseenter', function(event, d) {
        d3.select(this).select('.node-glow')
          .transition().duration(200).attr('opacity', 0.3);
        d3.select(this).select('.node-main')
          .transition().duration(200).attr('r', d.radius + 5);

        // Highlight connected links
        linkElements.transition().duration(200)
          .attr('stroke-opacity', l => {
            const sId = l.source.id || l.source;
            const tId = l.target.id || l.target;
            return (sId === d.id || tId === d.id) ? 0.9 : 0.05;
          });

        // Dim unconnected nodes
        nodeElements.select('.node-main')
          .transition().duration(200)
          .attr('opacity', n => {
            if (n.id === d.id) return 1;
            const connected = links.some(l => {
              const sId = l.source.id || l.source;
              const tId = l.target.id || l.target;
              return (sId === d.id && tId === n.id) || (tId === d.id && sId === n.id);
            });
            return connected ? 1 : 0.25;
          });

        setTooltipData({ ...d, type: 'node' });
        setTooltipPos({ x: event.offsetX, y: event.offsetY });
      })
      .on('mouseleave', function(event, d) {
        d3.select(this).select('.node-glow')
          .transition().duration(200).attr('opacity', 0);
        d3.select(this).select('.node-main')
          .transition().duration(200).attr('r', d.radius);

        linkElements.transition().duration(200)
          .attr('stroke-opacity', l => 0.2 + l.strength * 0.5);
        nodeElements.select('.node-main')
          .transition().duration(200).attr('opacity', 1);

        setTooltipData(null);
      })
      .on('click', function(event, d) {
        event.stopPropagation();
        setSelectedNode(prev => prev?.id === d.id ? null : d);
      });

    // Curved link path generator
    const linkArc = (d) => {
      const dx = d.target.x - d.source.x;
      const dy = d.target.y - d.source.y;
      const dr = Math.sqrt(dx * dx + dy * dy) * 1.2;
      return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
    };

    // Tick function
    simulation.on('tick', () => {
      linkElements.attr('d', linkArc);
      nodeElements.attr('transform', d => `translate(${d.x},${d.y})`);

      // Update edge gradients
      links.forEach((link, i) => {
        const gradient = defs.select(`#net-edge-gradient-${i}`);
        gradient.attr('x1', link.source.x).attr('y1', link.source.y)
          .attr('x2', link.target.x).attr('y2', link.target.y);
      });
    });

    // Pulse animation
    const animatePulse = () => {
      nodeElements.select('.pulse-ring')
        .transition()
        .duration(2000)
        .attr('r', d => d.radius + 20)
        .attr('opacity', 0.4)
        .attr('stroke-width', 1)
        .transition()
        .duration(2000)
        .attr('r', d => d.radius)
        .attr('opacity', 0)
        .attr('stroke-width', 2)
        .on('end', function() {
          if (animating) animatePulse();
        });
    };
    if (animating) animatePulse();

    // Particle animation along edges
    let particleTimer;
    let simulationWarmedUp = false;

    const animateParticles = () => {
      if (!animating || !simulationWarmedUp) {
        particleTimer = setTimeout(animateParticles, 800);
        return;
      }

      links.forEach((link, i) => {
        if (Math.random() > link.strength * 0.4) return;

        const path = linkElements.filter((d, idx) => idx === i).node();
        if (!path) return;

        let totalLength;
        try {
          totalLength = path.getTotalLength();
        } catch (e) { return; }
        if (!totalLength || totalLength < 1) return;

        const particle = particleGroup.append('circle')
          .attr('r', 2 + link.strength * 2)
          .attr('fill', nodes.find(n => n.id === (link.source.id || link.source))?.color || '#94A3B8')
          .attr('opacity', 0.8);

        const duration = 2000 + Math.random() * 2000;

        particle
          .transition()
          .duration(duration)
          .ease(d3.easeLinear)
          .attrTween('transform', () => {
            const len = totalLength;
            return (t) => {
              try {
                const point = path.getPointAtLength(t * len);
                return `translate(${point.x},${point.y})`;
              } catch (e) {
                return 'translate(0,0)';
              }
            };
          })
          .attr('opacity', 0)
          .remove();
      });

      particleTimer = setTimeout(animateParticles, 800);
    };

    // Delay particle start until simulation settles
    setTimeout(() => {
      simulationWarmedUp = true;
      if (animating) animateParticles();
    }, 1500);

    // Entrance animation
    nodeElements.attr('opacity', 0)
      .transition().duration(800).delay((d, i) => i * 100)
      .attr('opacity', 1);
    linkElements.attr('stroke-opacity', 0)
      .transition().duration(800).delay(500)
      .attr('stroke-opacity', d => 0.2 + d.strength * 0.5);

    return () => {
      simulation.stop();
      clearTimeout(particleTimer);
    };
  }, [buildGraphData, animating, width, height]);

  // Toggle animation
  useEffect(() => {
    if (!simulationRef.current) return;
    if (animating) {
      simulationRef.current.alphaTarget(0.01).restart();
    } else {
      simulationRef.current.alphaTarget(0).stop();
    }
  }, [animating]);

  // External zoom controls
  const handleZoom = (factor) => {
    if (!svgRef.current?._zoomBehavior) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(
      svgRef.current._zoomBehavior.scaleBy, factor
    );
  };

  const handleReset = () => {
    if (!svgRef.current?._zoomBehavior) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(500).call(
      svgRef.current._zoomBehavior.transform,
      d3.zoomIdentity.translate(width / 2, height / 2).scale(0.85).translate(-width / 2, -height / 2)
    );
  };

  // Build connected models list for selected node detail panel
  const selectedNodeConnections = useMemo(() => {
    if (!selectedNode || !connectionData?.connections) return [];
    return connectionData.connections
      .filter(c => c.source === selectedNode.id || c.target === selectedNode.id)
      .map(c => ({
        model: c.source === selectedNode.id ? c.target : c.source,
        strength: c.strength,
        sharedDomains: c.sharedDomains || [],
      }))
      .sort((a, b) => b.strength - a.strength);
  }, [selectedNode, connectionData]);

  if (!connectionData || !connectionData.connections) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-gray-500">Loading network graph...</div>
      </div>
    );
  }

  const { connections, models } = connectionData;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <NetworkIcon className="text-indigo-600 mr-3" size={24} />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Model Network Graph</h2>
            <p className="text-sm text-gray-600">
              Drag nodes, zoom, and hover to explore connections
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Animation toggle */}
          <button
            onClick={() => setAnimating(!animating)}
            className={`p-1.5 rounded transition-colors ${
              animating ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'
            }`}
            title={animating ? 'Pause animation' : 'Resume animation'}
          >
            {animating ? <Pause size={16} /> : <Play size={16} />}
          </button>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 ml-1">
            <button onClick={() => handleZoom(0.8)}
                    className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                    title="Zoom Out">
              <ZoomOut size={16} />
            </button>
            <button onClick={handleReset}
                    className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                    title="Reset View">
              <Maximize2 size={16} />
            </button>
            <button onClick={() => handleZoom(1.25)}
                    className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                    title="Zoom In">
              <ZoomIn size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Graph container */}
      <div className="relative border border-gray-200 rounded-lg overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="mx-auto block"
        />

        {/* Floating tooltip */}
        {tooltipData && (
          <div
            className="absolute pointer-events-none bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-xl p-3 z-50 max-w-xs"
            style={{
              left: Math.min(tooltipPos.x + 15, width - 220),
              top: Math.min(tooltipPos.y - 10, height - 120),
            }}
          >
            {tooltipData.type === 'node' ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tooltipData.color }} />
                  <span className="font-bold text-sm text-gray-900">{tooltipData.id}</span>
                </div>
                <p className="text-xs text-gray-600">{tooltipData.totalConnections} connections</p>
                <p className="text-xs text-gray-600">{tooltipData.connectedModelsCount} connected models</p>
                <p className="text-xs text-gray-600">{(tooltipData.totalPapers || 0).toLocaleString()} papers</p>
                {tooltipData.domain && (
                  <p className="text-xs text-gray-500 mt-0.5">{tooltipData.domain}</p>
                )}
                <p className="text-xs text-indigo-500 mt-1">Click for details</p>
              </>
            ) : (
              <>
                <p className="font-bold text-sm text-gray-900">
                  {tooltipData.source} ↔ {tooltipData.target}
                </p>
                <p className="text-xs text-gray-600">{(tooltipData.value || 0).toLocaleString()} shared papers</p>
                {tooltipData.sharedDomains && tooltipData.sharedDomains.length > 0 && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Domains: {tooltipData.sharedDomains.slice(0, 3).join(', ')}
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {/* Interaction hints */}
        <div className="absolute bottom-3 left-3 flex gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1"><Move size={12} /> Drag nodes</span>
          <span className="flex items-center gap-1"><MousePointer size={12} /> Click for details</span>
          <span>Scroll to zoom</span>
        </div>
      </div>

      {/* Selected node detail panel */}
      {selectedNode && (
        <div className="mt-4 border-2 rounded-lg p-4 transition-all"
             style={{ borderColor: selectedNode.color + '60', backgroundColor: selectedNode.color + '08' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedNode.color }} />
              <h3 className="font-bold text-gray-900">{selectedNode.id}</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                Science Model
              </span>
            </div>
            <button onClick={() => setSelectedNode(null)}
                    className="text-gray-400 hover:text-gray-600 text-sm px-2">
              Close
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-3">
            <div>
              <p className="text-2xl font-bold" style={{ color: selectedNode.color }}>
                {selectedNode.totalConnections}
              </p>
              <p className="text-xs text-gray-500">Total Connections</p>
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: selectedNode.color }}>
                {selectedNode.connectedModelsCount}
              </p>
              <p className="text-xs text-gray-500">Connected Models</p>
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: selectedNode.color }}>
                {(selectedNode.totalPapers || 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Total Papers</p>
            </div>
          </div>

          {selectedNode.domain && (
            <p className="text-sm text-gray-600 mb-3">{selectedNode.domain}</p>
          )}

          {selectedNodeConnections.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">Connected Models</p>
              <div className="flex flex-wrap gap-1">
                {selectedNodeConnections.map(conn => {
                  const config = getModelConfig(conn.model);
                  return (
                    <span key={conn.model} className="px-2 py-0.5 text-xs rounded-full"
                          style={{ backgroundColor: (config?.color || '#8B5CF6') + '20',
                                   color: config?.color || '#8B5CF6' }}>
                      {conn.model}: {conn.strength} papers
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <h3 className="text-xs font-semibold text-gray-700 mb-2">Interactions</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li><strong>Drag:</strong> Move nodes freely</li>
            <li><strong>Scroll:</strong> Zoom in/out</li>
            <li><strong>Hover:</strong> Highlight connections</li>
            <li><strong>Click:</strong> Show model details</li>
          </ul>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <h3 className="text-xs font-semibold text-gray-700 mb-2">Network Statistics</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li className="flex justify-between">
              <span>Total Models:</span>
              <span className="font-semibold">{models.length}</span>
            </li>
            <li className="flex justify-between">
              <span>Total Connections:</span>
              <span className="font-semibold">{connections.length}</span>
            </li>
            <li className="flex justify-between">
              <span>Strongest Link:</span>
              <span className="font-semibold">{connections[0]?.strength || 0} papers</span>
            </li>
            <li className="flex justify-between">
              <span>Avg Link Strength:</span>
              <span className="font-semibold">
                {connections.length > 0
                  ? Math.round(connections.reduce((sum, c) => sum + c.strength, 0) / connections.length)
                  : 0} papers
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NetworkGraph;

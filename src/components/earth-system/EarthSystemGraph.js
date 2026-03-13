// Interactive Earth System Network Graph
// D3 force-directed simulation with draggable nodes, animated particles,
// click-to-expand, and smooth zoom/pan

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import { Globe, ZoomIn, ZoomOut, Maximize2, Play, Pause, MousePointer, Move } from 'lucide-react';
import { SPHERE_DEFINITIONS } from '../../utils/earthSystemClassifier';
import { getModelConfig } from '../../config/modelConfig';

const EarthSystemGraph = ({ sphereData, interSphereLinks, modelSphereConnections }) => {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const simulationRef = useRef(null);
  const particlesRef = useRef(null);
  const [viewMode, setViewMode] = useState('models');
  const [animating, setAnimating] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [tooltipData, setTooltipData] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const width = 900;
  const height = 700;

  const sphereNames = useMemo(() => Object.keys(SPHERE_DEFINITIONS), []);

  // Build graph data for D3
  const buildGraphData = useCallback(() => {
    const nodes = [];
    const links = [];

    if (viewMode === 'spheres') {
      // Sphere nodes
      sphereNames.forEach(name => {
        const data = sphereData[name];
        if (!data) return;
        const getPaperCount = (d) => d.paperCount || d.papers?.length || 0;
        const maxPapers = Math.max(...sphereNames.map(s => getPaperCount(sphereData[s]) || 1));
        nodes.push({
          id: name,
          type: 'sphere',
          color: SPHERE_DEFINITIONS[name].color,
          paperCount: getPaperCount(data),
          citations: data.totalCitations,
          modelCount: Object.keys(data.models).length,
          domains: data.domains,
          models: data.models,
          radius: 30 + (getPaperCount(data) / maxPapers) * 35,
        });
      });

      // Inter-sphere links
      const maxCount = Math.max(...interSphereLinks.map(l => l.count), 1);
      interSphereLinks.forEach(link => {
        const [s1, s2] = link.spheres;
        links.push({
          source: s1,
          target: s2,
          value: link.count,
          strength: link.count / maxCount,
          papers: link.papers,
        });
      });
    } else {
      // Sphere nodes (smaller)
      sphereNames.forEach(name => {
        const data = sphereData[name];
        if (!data) return;
        nodes.push({
          id: name,
          type: 'sphere',
          color: SPHERE_DEFINITIONS[name].color,
          paperCount: data.paperCount || data.papers?.length || 0,
          citations: data.totalCitations,
          modelCount: Object.keys(data.models).length,
          radius: 28,
        });
      });

      // Model nodes
      const modelSet = new Set();
      modelSphereConnections.forEach(c => {
        if (c.count > 0 && !modelSet.has(c.model)) {
          modelSet.add(c.model);
          const config = getModelConfig(c.model);
          nodes.push({
            id: c.model,
            type: 'model',
            color: config?.color || '#6B7280',
            domain: config?.domain || '',
            radius: 18,
          });
        }
      });

      // Model-to-sphere links
      const maxCount = Math.max(...modelSphereConnections.map(c => c.count), 1);
      modelSphereConnections.filter(c => c.count > 0).forEach(c => {
        links.push({
          source: c.model,
          target: c.sphere,
          value: c.count,
          strength: c.count / maxCount,
        });
      });
    }

    return { nodes, links };
  }, [viewMode, sphereData, interSphereLinks, modelSphereConnections, sphereNames]);

  // Main D3 rendering
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { nodes, links } = buildGraphData();
    if (nodes.length === 0) return;

    // Create main group for zoom/pan
    const g = svg.append('g').attr('class', 'main-group');

    // Zoom behavior
    const zoomBehavior = d3.zoom()
      .scaleExtent([0.3, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    svg.call(zoomBehavior);

    // Initial centering
    svg.call(zoomBehavior.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(0.85).translate(-width / 2, -height / 2));

    // Store zoom for external controls
    svgRef.current._zoomBehavior = zoomBehavior;

    // Defs for gradients and filters
    const defs = svg.append('defs');

    // Glow filter
    const glowFilter = defs.append('filter').attr('id', 'glow');
    glowFilter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const feMerge = glowFilter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Pulse filter
    const pulseFilter = defs.append('filter').attr('id', 'pulse-glow');
    pulseFilter.append('feGaussianBlur').attr('stdDeviation', '6').attr('result', 'coloredBlur');
    const feMerge2 = pulseFilter.append('feMerge');
    feMerge2.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge2.append('feMergeNode').attr('in', 'SourceGraphic');

    // Arrow marker for model view
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#94A3B8');

    // Edge gradients
    links.forEach((link, i) => {
      const sourceNode = nodes.find(n => n.id === (link.source.id || link.source));
      const targetNode = nodes.find(n => n.id === (link.target.id || link.target));
      if (!sourceNode || !targetNode) return;

      const gradient = defs.append('linearGradient')
        .attr('id', `edge-gradient-${i}`)
        .attr('gradientUnits', 'userSpaceOnUse');
      gradient.append('stop').attr('offset', '0%').attr('stop-color', sourceNode.color).attr('stop-opacity', 0.6);
      gradient.append('stop').attr('offset', '100%').attr('stop-color', targetNode.color).attr('stop-opacity', 0.6);
    });

    // Force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(d => {
        if (viewMode === 'spheres') return 200 - d.strength * 60;
        return 160;
      }).strength(d => 0.3 + d.strength * 0.4))
      .force('charge', d3.forceManyBody().strength(d => d.type === 'sphere' ? -800 : -300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => d.radius + 15))
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
      .text('Earth');
    bgGroup.append('text')
      .attr('x', width / 2).attr('y', height / 2 + 10)
      .attr('text-anchor', 'middle').attr('fill', '#CBD5E1')
      .attr('font-size', '12px').attr('font-weight', '600')
      .text('System');

    // Draw links
    const linkGroup = g.append('g').attr('class', 'links');
    const linkElements = linkGroup.selectAll('path')
      .data(links)
      .enter()
      .append('path')
      .attr('fill', 'none')
      .attr('stroke', (d, i) => `url(#edge-gradient-${i})`)
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
    nodeElements.filter(d => d.type === 'sphere')
      .append('circle')
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
      .attr('filter', 'url(#glow)');

    // Main node circle
    nodeElements.append('circle')
      .attr('class', 'node-main')
      .attr('r', d => d.radius)
      .attr('fill', d => d.color)
      .attr('stroke', 'white')
      .attr('stroke-width', d => d.type === 'sphere' ? 4 : 3)
      .style('filter', 'url(#glow)');

    // Inner highlight
    nodeElements.filter(d => d.type === 'sphere')
      .append('circle')
      .attr('r', d => d.radius * 0.6)
      .attr('fill', 'white')
      .attr('opacity', 0.15);

    // Paper count inside sphere nodes
    nodeElements.filter(d => d.type === 'sphere')
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '14px')
      .attr('font-weight', '700')
      .text(d => (d.paperCount || 0).toLocaleString());

    // Node label
    nodeElements.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', d => d.radius + 18)
      .attr('fill', '#1E293B')
      .attr('font-size', d => d.type === 'sphere' ? '13px' : '11px')
      .attr('font-weight', '700')
      .text(d => d.id);

    // Sub-label for spheres
    nodeElements.filter(d => d.type === 'sphere')
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', d => d.radius + 32)
      .attr('fill', '#94A3B8')
      .attr('font-size', '10px')
      .text(d => `${d.modelCount} models`);

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
        const gradient = defs.select(`#edge-gradient-${i}`);
        gradient.attr('x1', link.source.x).attr('y1', link.source.y)
          .attr('x2', link.target.x).attr('y2', link.target.y);
      });
    });

    // Pulse animation
    const animatePulse = () => {
      nodeElements.filter(d => d.type === 'sphere')
        .select('.pulse-ring')
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

        // Guard: skip if path has no valid geometry yet
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

    // Delay particle start until simulation has run a few ticks
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
  }, [buildGraphData, viewMode, animating, width, height]);

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

  return (
    <div className="bg-white rounded-lg shadow-sm p-6" ref={containerRef}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Globe className="text-blue-600 mr-3" size={24} />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Earth System Network</h2>
            <p className="text-sm text-gray-600">
              Drag nodes, zoom, and hover to explore connections
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('spheres')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'spheres' ? 'bg-white shadow text-blue-600' : 'text-gray-600'
              }`}
            >
              Spheres
            </button>
            <button
              onClick={() => setViewMode('models')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'models' ? 'bg-white shadow text-blue-600' : 'text-gray-600'
              }`}
            >
              Models
            </button>
          </div>

          {/* Animation toggle */}
          <button
            onClick={() => setAnimating(!animating)}
            className={`p-1.5 rounded transition-colors ${
              animating ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
            }`}
            title={animating ? 'Pause animation' : 'Resume animation'}
          >
            {animating ? <Pause size={16} /> : <Play size={16} />}
          </button>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 ml-1">
            <button onClick={() => handleZoom(0.8)}
                    className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded transition-colors">
              <ZoomOut size={16} />
            </button>
            <button onClick={handleReset}
                    className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded transition-colors">
              <Maximize2 size={16} />
            </button>
            <button onClick={() => handleZoom(1.25)}
                    className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded transition-colors">
              <ZoomIn size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Graph container */}
      <div className="relative border border-gray-200 rounded-lg overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
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
                  <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">
                    {tooltipData.type}
                  </span>
                </div>
                {tooltipData.paperCount != null && (
                  <p className="text-xs text-gray-600">{(tooltipData.paperCount || 0).toLocaleString()} papers</p>
                )}
                {tooltipData.citations != null && (
                  <p className="text-xs text-gray-600">{(tooltipData.citations || 0).toLocaleString()} citations</p>
                )}
                {tooltipData.modelCount != null && (
                  <p className="text-xs text-gray-600">{tooltipData.modelCount} contributing models</p>
                )}
                {tooltipData.domain && (
                  <p className="text-xs text-gray-600">{tooltipData.domain}</p>
                )}
                <p className="text-xs text-blue-500 mt-1">Click for details</p>
              </>
            ) : (
              <>
                <p className="font-bold text-sm text-gray-900">
                  {tooltipData.source} ↔ {tooltipData.target}
                </p>
                <p className="text-xs text-gray-600">{(tooltipData.value || 0).toLocaleString()} shared papers</p>
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
        <div className="mt-4 border-2 rounded-lg p-4 transition-all animate-in"
             style={{ borderColor: selectedNode.color + '60', backgroundColor: selectedNode.color + '08' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedNode.color }} />
              <h3 className="font-bold text-gray-900">{selectedNode.id}</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {selectedNode.type === 'sphere' ? 'Earth System Sphere' : 'Science Model'}
              </span>
            </div>
            <button onClick={() => setSelectedNode(null)}
                    className="text-gray-400 hover:text-gray-600 text-sm px-2">
              Close
            </button>
          </div>

          {selectedNode.type === 'sphere' && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-2xl font-bold" style={{ color: selectedNode.color }}>
                  {(selectedNode.paperCount || 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">Papers</p>
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: selectedNode.color }}>
                  {(selectedNode.citations || 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">Citations</p>
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: selectedNode.color }}>
                  {selectedNode.modelCount}
                </p>
                <p className="text-xs text-gray-500">Models</p>
              </div>
              {selectedNode.models && (
                <div className="col-span-3">
                  <p className="text-xs font-semibold text-gray-700 mb-1">Contributing Models</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(selectedNode.models).sort((a, b) => b[1] - a[1]).map(([model, count]) => (
                      <span key={model} className="px-2 py-0.5 text-xs rounded-full"
                            style={{ backgroundColor: getModelConfig(model)?.color + '20',
                                     color: getModelConfig(model)?.color }}>
                        {model}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {selectedNode.domains && selectedNode.domains.length > 0 && (
                <div className="col-span-3">
                  <p className="text-xs font-semibold text-gray-700 mb-1">Research Domains</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedNode.domains.slice(0, 10).map(d => (
                      <span key={d} className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">{d}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedNode.type === 'model' && (
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm text-gray-600">{selectedNode.domain}</p>
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
            <li><strong>Click:</strong> Show sphere/model details</li>
          </ul>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <h3 className="text-xs font-semibold text-gray-700 mb-2">Visual Encoding</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li><strong>Node size:</strong> Number of papers</li>
            <li><strong>Edge width:</strong> Cross-sphere papers</li>
            <li><strong>Particles:</strong> Research flow direction</li>
            <li><strong>Pulse:</strong> Active sphere connections</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EarthSystemGraph;

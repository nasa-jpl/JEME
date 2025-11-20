// Network Graph - Interactive visualization of model connections
import React, { useRef, useState } from 'react';
import { Network as NetworkIcon, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { getModelConfig } from '../../config/modelConfig';

const NetworkGraph = ({ connectionData, networkMetrics }) => {
  const svgRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredEdge, setHoveredEdge] = useState(null);

  if (!connectionData || !connectionData.connections) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-gray-500">Loading network graph...</div>
      </div>
    );
  }

  const { connections, models } = connectionData;

  // Graph dimensions
  const width = 800;
  const height = 600;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.35;

  // Position nodes in a circle
  const nodePositions = {};
  models.forEach((model, index) => {
    const angle = (index / models.length) * 2 * Math.PI - Math.PI / 2;
    nodePositions[model] = {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  });

  // Get node size based on metrics
  const getNodeSize = (model) => {
    const metrics = networkMetrics?.metrics?.[model];
    if (!metrics) return 30;

    // Size based on total connections
    const maxConnections = Math.max(
      ...Object.values(networkMetrics.metrics).map(m => m.totalConnections)
    );
    const normalized = metrics.totalConnections / maxConnections;
    return 20 + normalized * 30; // Range: 20-50
  };

  // Get node color based on model config
  const getNodeColor = (model) => {
    const config = getModelConfig(model);
    return config?.color || '#8B5CF6';
  };

  // Get edge thickness based on connection strength
  const getEdgeThickness = (strength) => {
    const maxStrength = Math.max(...connections.map(c => c.strength));
    const normalized = strength / maxStrength;
    return 1 + normalized * 8; // Range: 1-9
  };

  // Get edge opacity based on connection strength
  const getEdgeOpacity = (strength) => {
    const maxStrength = Math.max(...connections.map(c => c.strength));
    const normalized = strength / maxStrength;
    return 0.2 + normalized * 0.6; // Range: 0.2-0.8
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));
  const handleReset = () => setZoom(1);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <NetworkIcon className="text-indigo-600 mr-3" size={24} />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Model Network Graph</h2>
            <p className="text-sm text-gray-600">Interactive visualization of model connections</p>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={18} />
          </button>
          <button
            onClick={handleReset}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            title="Reset Zoom"
          >
            <Maximize2 size={18} />
          </button>
          <button
            onClick={handleZoomIn}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={18} />
          </button>
          <span className="text-sm text-gray-600 ml-2">{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      {/* SVG Graph */}
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="mx-auto"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
        >
          {/* Edges */}
          <g className="edges">
            {connections.map((conn, index) => {
              const source = nodePositions[conn.source];
              const target = nodePositions[conn.target];
              const thickness = getEdgeThickness(conn.strength);
              const opacity = getEdgeOpacity(conn.strength);
              const isHovered = hoveredEdge === index;

              return (
                <g key={index}>
                  <line
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke={isHovered ? '#8B5CF6' : '#94A3B8'}
                    strokeWidth={isHovered ? thickness + 2 : thickness}
                    opacity={isHovered ? 1 : opacity}
                    className="transition-all cursor-pointer"
                    onMouseEnter={() => setHoveredEdge(index)}
                    onMouseLeave={() => setHoveredEdge(null)}
                  />
                  {isHovered && (
                    <g>
                      {/* Edge label background */}
                      <rect
                        x={(source.x + target.x) / 2 - 25}
                        y={(source.y + target.y) / 2 - 12}
                        width={50}
                        height={24}
                        fill="white"
                        stroke="#8B5CF6"
                        strokeWidth={2}
                        rx={4}
                      />
                      {/* Edge label text */}
                      <text
                        x={(source.x + target.x) / 2}
                        y={(source.y + target.y) / 2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-xs font-bold fill-purple-700"
                      >
                        {conn.strength}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>

          {/* Nodes */}
          <g className="nodes">
            {models.map((model, index) => {
              const pos = nodePositions[model];
              const size = getNodeSize(model);
              const color = getNodeColor(model);
              const metrics = networkMetrics?.metrics?.[model];
              const isHovered = hoveredNode === model;

              return (
                <g
                  key={model}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setHoveredNode(model)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  {/* Node circle */}
                  <circle
                    r={isHovered ? size + 5 : size}
                    fill={color}
                    stroke="white"
                    strokeWidth={isHovered ? 4 : 3}
                    className="transition-all"
                  />

                  {/* Node label */}
                  <text
                    y={size + 20}
                    textAnchor="middle"
                    className={`text-xs font-semibold ${isHovered ? 'fill-gray-900' : 'fill-gray-700'}`}
                  >
                    {model}
                  </text>

                  {/* Connection count badge */}
                  <circle
                    cx={size * 0.6}
                    cy={-size * 0.6}
                    r={12}
                    fill="white"
                    stroke={color}
                    strokeWidth={2}
                  />
                  <text
                    x={size * 0.6}
                    y={-size * 0.6}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-xs font-bold"
                    fill={color}
                  >
                    {metrics?.totalConnections || 0}
                  </text>

                  {/* Hover tooltip */}
                  {isHovered && metrics && (
                    <g>
                      <rect
                        x={-100}
                        y={-size - 80}
                        width={200}
                        height={70}
                        fill="white"
                        stroke={color}
                        strokeWidth={2}
                        rx={8}
                        className="drop-shadow-lg"
                      />
                      <text
                        y={-size - 60}
                        textAnchor="middle"
                        className="text-sm font-bold fill-gray-900"
                      >
                        {model}
                      </text>
                      <text
                        y={-size - 42}
                        textAnchor="middle"
                        className="text-xs fill-gray-600"
                      >
                        {metrics.totalConnections} connections
                      </text>
                      <text
                        y={-size - 28}
                        textAnchor="middle"
                        className="text-xs fill-gray-600"
                      >
                        {metrics.connectedModelsCount} models
                      </text>
                      <text
                        y={-size - 14}
                        textAnchor="middle"
                        className="text-xs fill-gray-600"
                      >
                        {metrics.totalPapers.toLocaleString()} papers
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">How to Read</h3>
          <ul className="text-xs text-gray-600 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-indigo-600">-</span>
              <span><strong>Node size:</strong> Indicates total number of connections</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-600">-</span>
              <span><strong>Edge thickness:</strong> Shows strength of connection (shared papers)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-600">-</span>
              <span><strong>Badge number:</strong> Total connections for that model</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-600">-</span>
              <span><strong>Hover:</strong> View detailed statistics</span>
            </li>
          </ul>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Network Statistics</h3>
          <ul className="text-xs text-gray-600 space-y-2">
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
              <span className="font-semibold">
                {connections[0]?.strength || 0} papers
              </span>
            </li>
            <li className="flex justify-between">
              <span>Average Link Strength:</span>
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

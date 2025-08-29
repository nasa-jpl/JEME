// src/components/InteractiveWorldMap.js
// Interactive world map component for displaying RAPID geographic data

import React, { useEffect, useRef, useState } from 'react';
import { Info, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

const InteractiveWorldMap = ({ watershedData, selectedRegion, onRegionSelect }) => {
  const svgRef = useRef(null);
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, content: null });
  const [mapTransform, setMapTransform] = useState({ scale: 1, translateX: 0, translateY: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [worldData, setWorldData] = useState(null);

  // Load world map data
  useEffect(() => {
    // Create realistic world map using pre-calculated SVG paths
    const worldFeatures = {
      land: {
        // Realistic continent shapes using SVG coordinates (simplified but recognizable)
        path: "M50,150 C80,120 120,100 160,110 L200,120 C240,130 280,140 320,160 L340,180 C350,200 345,220 335,240 L320,260 C300,280 280,290 250,285 L200,280 C160,275 120,270 90,250 L70,230 C50,210 45,190 50,170 Z M120,300 C140,280 170,270 200,275 L240,285 C280,295 320,310 340,340 L350,370 C345,400 330,420 310,430 L280,435 C250,430 220,420 200,400 L180,380 C160,360 150,340 155,320 L165,305 Z M430,120 C470,100 510,110 540,130 L570,150 C590,170 595,190 585,210 L575,230 C565,250 550,260 530,255 L500,250 C470,245 450,230 440,210 L435,190 C432,170 430,150 430,130 Z M450,260 C480,240 520,245 550,260 L580,280 C600,300 605,320 595,340 L585,360 C575,380 560,390 540,385 L510,380 C480,375 460,360 450,340 L445,320 C442,300 445,280 450,270 Z M620,160 C660,140 700,150 730,170 L760,190 C780,210 785,230 775,250 L765,270 C755,290 740,300 720,295 L690,290 C660,285 640,270 630,250 L625,230 C622,210 620,190 620,170 Z M650,320 C680,300 720,305 750,320 L780,340 C800,360 805,380 795,400 L785,420 C775,440 760,450 740,445 L710,440 C680,435 660,420 650,400 L645,380 C642,360 645,340 650,330 Z"
      },
      countries: {
        features: []
      }
    };
    
    setWorldData(worldFeatures);
  }, []);

  // Simple function to return pre-calculated path
  const createPath = (feature) => {
    if (feature?.path) {
      return feature.path;
    }
    return '';
  };

  // Country coordinates (simplified major watersheds/countries)
  const countryCoordinates = {
    'USA': { x: 200, y: 200, name: 'United States' },
    'United States': { x: 200, y: 200, name: 'United States' },
    'Canada': { x: 180, y: 120, name: 'Canada' },
    'Mexico': { x: 160, y: 280, name: 'Mexico' },
    'Brazil': { x: 320, y: 380, name: 'Brazil' },
    'Peru': { x: 280, y: 350, name: 'Peru' },
    'Colombia': { x: 260, y: 320, name: 'Colombia' },
    'France': { x: 480, y: 200, name: 'France' },
    'Germany': { x: 500, y: 180, name: 'Germany' },
    'Spain': { x: 460, y: 220, name: 'Spain' },
    'Italy': { x: 510, y: 220, name: 'Italy' },
    'UK': { x: 470, y: 160, name: 'United Kingdom' },
    'Bulgaria': { x: 530, y: 210, name: 'Bulgaria' },
    'China': { x: 650, y: 220, name: 'China' },
    'India': { x: 620, y: 280, name: 'India' },
    'Bangladesh': { x: 640, y: 290, name: 'Bangladesh' },
    'Nepal': { x: 630, y: 270, name: 'Nepal' },
    'Cambodia': { x: 680, y: 310, name: 'Cambodia' },
    'Australia': { x: 750, y: 420, name: 'Australia' },
  };

  // Process watershed data to get country statistics
  const getCountryStats = () => {
    const countryStats = {};
    
    watershedData.forEach(watershed => {
      const countries = watershed.countries.split(/[,/]/).map(c => c.trim());
      countries.forEach(country => {
        if (countryCoordinates[country]) {
          if (!countryStats[country]) {
            countryStats[country] = {
              name: country,
              watersheds: 0,
              papers: 0,
              citations: 0,
              domains: new Set()
            };
          }
          countryStats[country].watersheds += 1;
          countryStats[country].papers += watershed.papers;
          countryStats[country].citations += watershed.citations;
          watershed.domains.split(', ').forEach(domain => {
            if (domain.trim()) countryStats[country].domains.add(domain.trim());
          });
        }
      });
    });

    return Object.values(countryStats).map(stat => ({
      ...stat,
      domains: Array.from(stat.domains).join(', '),
      coords: countryCoordinates[stat.name]
    }));
  };

  const countryStats = getCountryStats();

  // Get circle size based on number of papers
  const getCircleSize = (papers) => {
    const minSize = 4;
    const maxSize = 20;
    const maxPapers = Math.max(...countryStats.map(c => c.papers));
    return minSize + (papers / maxPapers) * (maxSize - minSize);
  };

  // Get color based on region
  const getRegionColor = (country) => {
    const countryName = country.toLowerCase();
    if (countryName.includes('usa') || countryName.includes('united states') || 
        countryName.includes('canada') || countryName.includes('mexico')) {
      return '#3B82F6'; // Blue for North America
    }
    if (countryName.includes('france') || countryName.includes('germany') || 
        countryName.includes('spain') || countryName.includes('italy') || 
        countryName.includes('uk') || countryName.includes('bulgaria')) {
      return '#10B981'; // Green for Europe
    }
    if (countryName.includes('china') || countryName.includes('india') || 
        countryName.includes('bangladesh') || countryName.includes('nepal') || 
        countryName.includes('cambodia')) {
      return '#F59E0B'; // Amber for Asia
    }
    if (countryName.includes('brazil') || countryName.includes('peru') || 
        countryName.includes('colombia')) {
      return '#EF4444'; // Red for South America
    }
    if (countryName.includes('australia')) {
      return '#8B5CF6'; // Purple for Australia
    }
    return '#6B7280'; // Gray for others
  };

  // Handle mouse events for interactivity
  const handleMouseMove = (e) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      setMapTransform(prev => ({
        ...prev,
        translateX: prev.translateX + deltaX,
        translateY: prev.translateY + deltaY
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    e.preventDefault();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoom = (factor) => {
    setMapTransform(prev => ({
      ...prev,
      scale: Math.max(0.5, Math.min(3, prev.scale * factor))
    }));
  };

  const resetView = () => {
    setMapTransform({ scale: 1, translateX: 0, translateY: 0 });
  };

  const showTooltip = (e, country) => {
    const rect = svgRef.current.getBoundingClientRect();
    setTooltip({
      show: true,
      x: e.clientX - rect.left + 10,
      y: e.clientY - rect.top - 10,
      content: country
    });
  };

  const hideTooltip = () => {
    setTooltip({ show: false, x: 0, y: 0, content: null });
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e) => handleMouseMove(e);
    const handleGlobalMouseUp = () => handleMouseUp();

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragStart]);

  return (
    <div className="relative bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-gray-200 overflow-hidden">
      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
        <button
          onClick={() => handleZoom(1.2)}
          className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
          title="Zoom In"
        >
          <ZoomIn size={16} className="text-gray-600" />
        </button>
        <button
          onClick={() => handleZoom(0.8)}
          className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut size={16} className="text-gray-600" />
        </button>
        <button
          onClick={resetView}
          className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
          title="Reset View"
        >
          <RotateCcw size={16} className="text-gray-600" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-md p-3">
        <h4 className="text-xs font-semibold text-gray-700 mb-2">Regions</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
            <span className="text-gray-600">North America</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            <span className="text-gray-600">Europe</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
            <span className="text-gray-600">Asia</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
            <span className="text-gray-600">South America</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
            <span className="text-gray-600">Australia</span>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="text-xs text-gray-500">Circle size = Papers</div>
        </div>
      </div>

      {/* SVG Map */}
      <svg
        ref={svgRef}
        width="100%"
        height="400"
        viewBox="0 0 900 500"
        className="cursor-move"
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        {/* World Map Background (realistic) */}
        <g transform={`translate(${mapTransform.translateX}, ${mapTransform.translateY}) scale(${mapTransform.scale})`}>
          {/* Render realistic world map */}
          {worldData && !worldData.error && (
            <>
              {/* Land masses */}
              <path
                d={createPath(worldData.land)}
                fill="#F3F4F6"
                stroke="#E5E7EB"
                strokeWidth="0.5"
                opacity="0.8"
              />
              
              {/* Country borders */}
              {worldData.countries?.features?.map((country, index) => (
                <path
                  key={`country-${index}`}
                  d={createPath(country)}
                  fill="none"
                  stroke="#D1D5DB"
                  strokeWidth="0.3"
                  opacity="0.6"
                />
              ))}
            </>
          )}
          
          {/* Fallback for when world data is loading or failed */}
          {(!worldData || worldData.error) && (
            <>
              <rect
                x="0"
                y="0"
                width="900"
                height="500"
                fill="#F9FAFB"
                stroke="#E5E7EB"
                strokeWidth="1"
              />
              <text x="450" y="230" textAnchor="middle" className="text-sm fill-gray-400">
                {!worldData ? 'Loading world map...' : 'Failed to load world map'}
              </text>
              <text x="450" y="250" textAnchor="middle" className="text-xs fill-gray-500">
                {worldData?.error ? 'Using fallback display' : 'Please wait...'}
              </text>
              
              {/* Simple fallback rectangles for when real map fails */}
              {worldData?.error && (
                <>
                  <rect x="50" y="150" width="300" height="200" fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="1" opacity="0.3" />
                  <text x="200" y="250" textAnchor="middle" className="text-xs fill-gray-400">Americas</text>
                  
                  <rect x="400" y="100" width="200" height="200" fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="1" opacity="0.3" />
                  <text x="500" y="200" textAnchor="middle" className="text-xs fill-gray-400">Europe/Africa</text>
                  
                  <rect x="600" y="120" width="250" height="260" fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="1" opacity="0.3" />
                  <text x="725" y="250" textAnchor="middle" className="text-xs fill-gray-400">Asia/Australia</text>
                </>
              )}
            </>
          )}

          {/* Country markers */}
          {countryStats.map((country, index) => (
            <g key={index}>
              <circle
                cx={country.coords.x}
                cy={country.coords.y}
                r={getCircleSize(country.papers)}
                fill={getRegionColor(country.name)}
                stroke="white"
                strokeWidth="2"
                opacity="0.8"
                className="hover:opacity-100 transition-opacity cursor-pointer"
                onMouseEnter={(e) => showTooltip(e, country)}
                onMouseLeave={hideTooltip}
                onClick={() => onRegionSelect && onRegionSelect(country.name)}
              />
              {/* Country label for larger markers */}
              {country.papers > 5 && (
                <text
                  x={country.coords.x}
                  y={country.coords.y + getCircleSize(country.papers) + 12}
                  textAnchor="middle"
                  className="text-xs font-medium fill-gray-700"
                  pointerEvents="none"
                >
                  {country.name}
                </text>
              )}
            </g>
          ))}

          {/* Connection lines between related watersheds */}
          {countryStats.length > 1 && (
            <g opacity="0.1">
              {countryStats.slice(0, -1).map((country, index) => {
                const nextCountry = countryStats[index + 1];
                return (
                  <line
                    key={`connection-${index}`}
                    x1={country.coords.x}
                    y1={country.coords.y}
                    x2={nextCountry.coords.x}
                    y2={nextCountry.coords.y}
                    stroke="#6B7280"
                    strokeWidth="1"
                    strokeDasharray="2,2"
                  />
                );
              })}
            </g>
          )}
        </g>
      </svg>

      {/* Tooltip */}
      {tooltip.show && tooltip.content && (
        <div
          className="absolute z-20 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translateY(-100%)'
          }}
        >
          <div className="font-semibold">{tooltip.content.name}</div>
          <div className="text-gray-300">
            {tooltip.content.watersheds} watershed{tooltip.content.watersheds !== 1 ? 's' : ''}
          </div>
          <div className="text-gray-300">
            {tooltip.content.papers} paper{tooltip.content.papers !== 1 ? 's' : ''}
          </div>
          <div className="text-gray-300">
            {tooltip.content.citations} citation{tooltip.content.citations !== 1 ? 's' : ''}
          </div>
          {tooltip.content.domains && (
            <div className="text-gray-300 text-xs mt-1 max-w-xs">
              Domains: {tooltip.content.domains.substring(0, 50)}
              {tooltip.content.domains.length > 50 && '...'}
            </div>
          )}
        </div>
      )}

      {/* Info Panel */}
      <div className="absolute bottom-4 left-4 right-4 bg-white bg-opacity-90 rounded-lg p-3 backdrop-blur-sm">
        <div className="flex items-start">
          <Info size={16} className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-gray-600">
            <strong>Interactive RAPID Global Impact Map</strong> - 
            Showing {countryStats.length} countries with RAPID implementations. 
            Circle size represents number of research papers. Click and drag to pan, use controls to zoom. 
            Hover over markers for detailed statistics.
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveWorldMap;
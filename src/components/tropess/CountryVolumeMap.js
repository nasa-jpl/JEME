// src/components/tropess/CountryVolumeMap.js
// Choropleth world map of cumulative TROPESS downloads (files) by country.
// Uses d3-geo (Natural Earth projection) + topojson-client with the
// world-atlas countries-110m TopoJSON served from public/data/.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  geoNaturalEarth1, geoPath, scaleSequentialLog, interpolateBlues,
} from 'd3';
import { feature } from 'topojson-client';

const WIDTH = 960;
const HEIGHT = 480;

const formatFiles = (n) => {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return `${n}`;
};

const CountryVolumeMap = ({ countryMap = [] }) => {
  const [topo, setTopo] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${process.env.PUBLIC_URL}/data/countries-110m.json`)
      .then((r) => r.json())
      .then((json) => { if (!cancelled) setTopo(json); })
      .catch((e) => console.error('Failed to load world atlas:', e));
    return () => { cancelled = true; };
  }, []);

  // atlas country name -> files downloaded
  const filesByName = useMemo(() => {
    const m = new Map();
    countryMap.forEach((c) => m.set(c.atlas_name, c.files));
    return m;
  }, [countryMap]);

  const maxFiles = useMemo(
    () => countryMap.reduce((mx, c) => Math.max(mx, c.files), 0),
    [countryMap]
  );

  const { features, pathGen, color } = useMemo(() => {
    if (!topo) return { features: [], pathGen: null, color: null };
    const geo = feature(topo, topo.objects.countries);
    const projection = geoNaturalEarth1().fitSize([WIDTH, HEIGHT], geo);
    const pathGen = geoPath(projection);
    // Log scale: downloads span several orders of magnitude across countries.
    const color = scaleSequentialLog(interpolateBlues).domain([1, maxFiles || 1]);
    return { features: geo.features, pathGen, color };
  }, [topo, maxFiles]);

  const handleMove = (evt, name) => {
    const files = filesByName.get(name);
    const rect = wrapRef.current?.getBoundingClientRect();
    setTooltip({
      x: evt.clientX - (rect?.left || 0),
      y: evt.clientY - (rect?.top || 0),
      name,
      files,
    });
  };

  if (!topo || !pathGen) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-400">
        Loading map…
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative w-full">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto" role="img"
        aria-label="World map of TROPESS downloads by country">
        <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="#f8fafc" />
        {features.map((f) => {
          const name = f.properties.name;
          const files = filesByName.get(name);
          const fill = files != null ? color(Math.max(files, 1)) : '#e5e7eb';
          return (
            <path
              key={f.id || name}
              d={pathGen(f)}
              fill={fill}
              stroke="#94a3b8"
              strokeWidth={0.4}
              onMouseMove={(e) => handleMove(e, name)}
              onMouseLeave={() => setTooltip(null)}
              style={{ cursor: files != null ? 'pointer' : 'default' }}
            />
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-2 px-2">
        <span className="text-xs text-gray-500">Low</span>
        <div
          className="h-3 flex-1 rounded"
          style={{
            background: `linear-gradient(to right, ${interpolateBlues(0.15)}, ${interpolateBlues(0.5)}, ${interpolateBlues(0.95)})`,
          }}
        />
        <span className="text-xs text-gray-500">High ({formatFiles(maxFiles)} files)</span>
        <span className="inline-flex items-center gap-1 ml-3 text-xs text-gray-400">
          <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: '#e5e7eb' }} />
          No downloads
        </span>
      </div>

      {tooltip && (
        <div
          className="absolute pointer-events-none bg-gray-900 text-white text-xs rounded px-2 py-1 shadow-lg z-10"
          style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
        >
          <div className="font-semibold">{tooltip.name}</div>
          <div>
            {tooltip.files != null
              ? `${tooltip.files.toLocaleString()} files`
              : 'No downloads'}
          </div>
        </div>
      )}
    </div>
  );
};

export default CountryVolumeMap;

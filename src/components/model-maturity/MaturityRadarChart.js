import React, { useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { getModelConfig } from '../../config/modelConfig';
import { TIER1_DIMENSIONS } from '../../config/mclConfig';

const MaturityRadarChart = ({ mclData, selectedModels }) => {
  const [hoveredModel, setHoveredModel] = useState(null);

  const models = selectedModels || Object.keys(mclData);

  // Build radar data: one entry per dimension
  const radarData = TIER1_DIMENSIONS.map(dim => {
    const entry = { dimension: dim.shortLabel, fullName: dim.label };
    models.forEach(model => {
      entry[model] = mclData[model]?.tier1?.[dim.id]?.score ?? 0;
    });
    return entry;
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const dim = TIER1_DIMENSIONS.find(d => d.shortLabel === label);
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs">
        <p className="font-semibold text-sm text-gray-900 mb-1">{dim?.label || label}</p>
        <p className="text-xs text-gray-500 mb-2">{dim?.description}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="font-medium">{p.dataKey}:</span>
            <span>{p.value}/3</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-1">Tier 1 Capability Radar</h3>
      <p className="text-sm text-gray-600 mb-4">14 core dimensions scored 0-3 across all models</p>
      <ResponsiveContainer width="100%" height={500}>
        <RadarChart data={radarData} outerRadius="75%">
          <PolarGrid strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fontSize: 10, fill: '#4B5563' }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 3]}
            tickCount={4}
            tick={{ fontSize: 10, fill: '#9CA3AF' }}
          />
          <Tooltip content={<CustomTooltip />} />
          {models.map((model) => {
            const config = getModelConfig(model);
            return (
              <Radar
                key={model}
                name={model}
                dataKey={model}
                stroke={config?.color || '#6B7280'}
                fill={config?.color || '#6B7280'}
                fillOpacity={hoveredModel === model ? 0.35 : 0.1}
                strokeWidth={hoveredModel === model ? 3 : 1.5}
                onMouseEnter={() => setHoveredModel(model)}
                onMouseLeave={() => setHoveredModel(null)}
              />
            );
          })}
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            onMouseEnter={(e) => setHoveredModel(e.dataKey)}
            onMouseLeave={() => setHoveredModel(null)}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MaturityRadarChart;

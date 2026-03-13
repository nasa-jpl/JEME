import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getModelConfig } from '../../config/modelConfig';
import { TIER1_DIMENSIONS, SCORE_COLORS } from '../../config/mclConfig';

const DimensionBarChart = ({ mclData, dimensionId }) => {
  const dim = TIER1_DIMENSIONS.find(d => d.id === dimensionId);
  if (!dim) return null;

  const models = Object.keys(mclData);
  const chartData = models.map(model => ({
    model,
    score: mclData[model]?.tier1?.[dimensionId]?.score ?? 0,
    color: getModelConfig(model)?.color || '#6B7280',
  })).sort((a, b) => b.score - a.score);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    const evidence = mclData[d.model]?.tier1?.[dimensionId]?.evidence;
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
          <span className="font-semibold text-sm">{d.model}</span>
          <span className="text-xs px-1.5 py-0.5 rounded"
                style={{ backgroundColor: SCORE_COLORS[d.score]?.bg, color: SCORE_COLORS[d.score]?.text }}>
            Level {d.score}
          </span>
        </div>
        {evidence && <p className="text-xs text-gray-600 mt-1 line-clamp-3">{evidence}</p>}
      </div>
    );
  };

  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-1">{dim.label}</h4>
      <p className="text-xs text-gray-500 mb-3">{dim.description}</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 70, right: 20, top: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" domain={[0, 3]} ticks={[0, 1, 2, 3]} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="model" tick={{ fontSize: 11 }} width={65} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="score" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DimensionBarChart;

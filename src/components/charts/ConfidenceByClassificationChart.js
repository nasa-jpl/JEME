// src/components/charts/ConfidenceByClassificationChart.js
// Grouped bar chart: avg confidence per engagement level

import React, { useMemo } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { calculateUncertaintyMetrics, getConfidenceColor } from '../../utils/uncertaintyUtils';

const ConfidenceByClassificationChart = ({ data }) => {
  const metrics = useMemo(() => calculateUncertaintyMetrics(data), [data]);

  if (!metrics || !metrics.confidenceByEngagement || metrics.confidenceByEngagement.length === 0) {
    return null;
  }

  const chartData = metrics.confidenceByEngagement.map(item => ({
    name: item.level.replace('Level ', 'L').replace(': Simple Citation', ': Citation').replace(': Foundational Method', ': Foundation'),
    fullName: item.level,
    avgConfidence: Math.round(item.avgConfidence * 100),
    count: item.count,
    color: getConfidenceColor(item.avgConfidence)
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{d.fullName}</p>
          <p className="text-sm text-gray-600">
            Avg confidence: {d.avgConfidence}%
          </p>
          <p className="text-sm text-gray-600">
            {d.count} papers
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm">
      <div className="mb-4">
        <div className="text-base font-semibold text-gray-800">Confidence by Engagement Level</div>
        <div className="text-sm text-gray-500">
          Average classification confidence for each engagement tier
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis
              tick={{ fontSize: 11 }}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="avgConfidence" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, idx) => (
                <Cell key={idx} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ConfidenceByClassificationChart;

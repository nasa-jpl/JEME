// src/components/charts/StochasticVarianceCard.js
// Bar chart showing stochastic variance distribution from Phase 2 multi-temperature sampling

import React, { useMemo } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Shuffle } from 'lucide-react';

const StochasticVarianceCard = ({ data }) => {
  const { distribution, stats } = useMemo(() => {
    if (!data || !Array.isArray(data)) return { distribution: [], stats: null };

    const bins = [
      { range: '0.0-0.1', min: 0, max: 0.1, count: 0, label: 'Unanimous', color: '#22C55E' },
      { range: '0.1-0.2', min: 0.1, max: 0.2, count: 0, label: 'Near-unanimous', color: '#84CC16' },
      { range: '0.2-0.3', min: 0.2, max: 0.3, count: 0, label: 'Minor disagreement', color: '#F59E0B' },
      { range: '0.3-0.5', min: 0.3, max: 0.5, count: 0, label: 'Moderate disagreement', color: '#F97316' },
      { range: '0.5-1.0', min: 0.5, max: 1.01, count: 0, label: 'Major disagreement', color: '#EF4444' },
    ];

    let total = 0;
    let highAgreement = 0;
    let lowAgreement = 0;

    data.forEach(entry => {
      const sv = entry.uncertainty?.error_estimates?.stochastic_variance;
      if (sv === null || sv === undefined) return;
      total++;
      if (sv < 0.2) highAgreement++;
      if (sv > 0.5) lowAgreement++;
      for (const bin of bins) {
        if (sv >= bin.min && sv < bin.max) {
          bin.count++;
          break;
        }
      }
    });

    return {
      distribution: bins,
      stats: total > 0 ? {
        total,
        highAgreement,
        lowAgreement,
        highPct: Math.round((highAgreement / total) * 100),
        lowPct: Math.round((lowAgreement / total) * 100),
      } : null
    };
  }, [data]);

  if (!stats) return null;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{d.label}</p>
          <p className="text-sm text-gray-600">Variance: {d.range}</p>
          <p className="text-sm text-gray-600">{d.count} entries</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Shuffle size={20} className="text-purple-600" />
        <div>
          <div className="text-base font-semibold text-gray-800">Stochastic Variance</div>
          <div className="text-sm text-gray-500">
            Multi-temperature LLM agreement across {stats.total.toLocaleString()} entries
          </div>
        </div>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={distribution} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="range" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {distribution.map((bin, idx) => (
                <Cell key={idx} fill={bin.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-gray-500 mb-1">High agreement (&lt;0.2)</div>
          <div className="text-lg font-bold text-green-600">
            {stats.highPct}%
            <span className="text-xs font-normal text-gray-500 ml-1">({stats.highAgreement.toLocaleString()})</span>
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Low agreement (&gt;0.5)</div>
          <div className="text-lg font-bold text-red-500">
            {stats.lowPct}%
            <span className="text-xs font-normal text-gray-500 ml-1">({stats.lowAgreement.toLocaleString()})</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StochasticVarianceCard;

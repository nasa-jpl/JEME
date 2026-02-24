// src/components/charts/EvidenceGapsCard.js
// Card showing abstract coverage and entries with high engagement but low evidence

import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { AlertTriangle } from 'lucide-react';
import { calculateUncertaintyMetrics, getConfidenceColor } from '../../utils/uncertaintyUtils';

const EvidenceGapsCard = ({ data }) => {
  const [showAll, setShowAll] = useState(false);
  const metrics = useMemo(() => calculateUncertaintyMetrics(data), [data]);

  const gapEntries = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    return data
      .filter(entry => {
        if (!entry.uncertainty) return false;
        const u = entry.uncertainty;
        // High engagement (Level 3+) but low evidence
        const isHighEngagement = (entry.engagement_level || '').includes('Level 3') ||
          (entry.engagement_level || '').includes('Level 4');
        return isHighEngagement && u.evidence_confidence < 0.5;
      })
      .sort((a, b) => a.uncertainty.evidence_confidence - b.uncertainty.evidence_confidence)
      .slice(0, 50);
  }, [data]);

  if (!metrics) return null;

  const pieData = [
    { name: 'With Abstract', value: metrics.abstractCount, color: '#22C55E' },
    { name: 'Without Abstract', value: metrics.totalWithUncertainty - metrics.abstractCount, color: '#EF4444' }
  ];

  const miscPieData = [
    { name: 'Low Risk', value: metrics.miscalibrationDistribution.low, color: '#22C55E' },
    { name: 'Medium Risk', value: metrics.miscalibrationDistribution.medium, color: '#F59E0B' },
    { name: 'High Risk', value: metrics.miscalibrationDistribution.high, color: '#EF4444' }
  ].filter(d => d.value > 0);

  const displayEntries = showAll ? gapEntries : gapEntries.slice(0, 10);

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle size={20} className="text-amber-500" />
        <div>
          <div className="text-base font-semibold text-gray-800">Evidence Gaps</div>
          <div className="text-sm text-gray-500">
            Data quality analysis and flagged entries
          </div>
        </div>
      </div>

      {/* Pie charts row */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-xs font-medium text-gray-600 text-center mb-1">Abstract Coverage</div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  dataKey="value"
                >
                  {pieData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} entries`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-3 text-xs text-gray-500">
            {pieData.map((d, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                {d.name}
              </span>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs font-medium text-gray-600 text-center mb-1">Miscalibration Risk</div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={miscPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  dataKey="value"
                >
                  {miscPieData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} entries`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-3 text-xs text-gray-500">
            {miscPieData.map((d, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                {d.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Gap entries table */}
      {gapEntries.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="text-sm font-medium text-gray-700 mb-2">
            High Engagement / Low Evidence ({gapEntries.length} entries)
          </div>
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-2 py-1 text-left text-gray-500">Title</th>
                  <th className="px-2 py-1 text-left text-gray-500">Engagement</th>
                  <th className="px-2 py-1 text-center text-gray-500">Evidence</th>
                  <th className="px-2 py-1 text-center text-gray-500">Abstract</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayEntries.map((entry, idx) => {
                  const title = typeof entry.title === 'string' ? entry.title : (Array.isArray(entry.title) ? entry.title[0] : 'Untitled');
                  return (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-2 py-1 max-w-xs truncate" title={title}>
                        {title}
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap">
                        {(entry.engagement_level || '').replace('Level ', 'L')}
                      </td>
                      <td className="px-2 py-1 text-center">
                        <span style={{ color: getConfidenceColor(entry.uncertainty.evidence_confidence) }}>
                          {Math.round(entry.uncertainty.evidence_confidence * 100)}%
                        </span>
                      </td>
                      <td className="px-2 py-1 text-center">
                        {entry.uncertainty.evidence_flags?.has_abstract
                          ? <span className="text-green-600">Yes</span>
                          : <span className="text-red-500">No</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {gapEntries.length > 10 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800"
            >
              {showAll ? 'Show less' : `Show all ${gapEntries.length} entries`}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EvidenceGapsCard;

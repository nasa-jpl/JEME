// src/components/charts/UncertaintyMatrixCard.js
// 2D heatmap: evidence confidence (x) x reasoning confidence (y)

import React, { useMemo } from 'react';
import { Grid } from 'lucide-react';
import { buildConfidenceMatrix } from '../../utils/uncertaintyUtils';

const UncertaintyMatrixCard = ({ data }) => {
  const matrixData = useMemo(() => buildConfidenceMatrix(data), [data]);

  if (!matrixData || matrixData.maxCount === 0) return null;

  const getIntensityColor = (count) => {
    if (count === 0) return { bg: '#F9FAFB', text: '#9CA3AF' }; // gray-50 / gray-400
    const intensity = count / matrixData.maxCount;
    if (intensity > 0.7) return { bg: '#1E40AF', text: '#FFFFFF' }; // blue-800
    if (intensity > 0.4) return { bg: '#3B82F6', text: '#FFFFFF' }; // blue-500
    if (intensity > 0.15) return { bg: '#93C5FD', text: '#1E3A5F' }; // blue-300
    return { bg: '#DBEAFE', text: '#1E40AF' }; // blue-100
  };

  // Rows are reasoning (displayed top-to-bottom: High, Med, Low)
  const rowsReversed = [...matrixData.rowLabels].reverse();
  const matrixReversed = [...matrixData.matrix].reverse();

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm h-full">
      <div className="flex items-center gap-2 mb-4">
        <Grid size={20} className="text-purple-600" />
        <div>
          <div className="text-base font-semibold text-gray-800">Confidence Matrix</div>
          <div className="text-sm text-gray-500">
            Evidence quality vs reasoning confidence
          </div>
        </div>
      </div>

      {/* Matrix */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-xs text-gray-500 font-medium text-right w-28">
                Reasoning ↓ / Evidence →
              </th>
              {matrixData.colLabels.map((label, idx) => (
                <th key={idx} className="p-2 text-xs text-gray-600 font-medium text-center">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowsReversed.map((rowLabel, rowIdx) => (
              <tr key={rowIdx}>
                <td className="p-2 text-xs text-gray-600 font-medium text-right whitespace-nowrap">
                  {rowLabel}
                </td>
                {matrixReversed[rowIdx].map((count, colIdx) => {
                  const colors = getIntensityColor(count);
                  return (
                    <td key={colIdx} className="p-1">
                      <div
                        className="rounded-md text-center py-4 px-2 text-sm font-semibold transition-all hover:ring-2 hover:ring-blue-400"
                        style={{
                          backgroundColor: colors.bg,
                          color: colors.text
                        }}
                        title={`Evidence: ${matrixData.colLabels[colIdx]}, Reasoning: ${rowLabel} — ${count} entries`}
                      >
                        {count > 0 ? count.toLocaleString() : ''}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span>Density:</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#DBEAFE' }} />
            <span>Few</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3B82F6' }} />
            <span>Many</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#1E40AF' }} />
            <span>Most</span>
          </div>
        </div>
        <span>Click cells for details</span>
      </div>
    </div>
  );
};

export default UncertaintyMatrixCard;

// src/components/charts/UncertaintyMatrixCard.js
// 2D heatmap: evidence confidence (x) x reasoning confidence (y)

import React, { useState, useMemo } from 'react';
import { Grid, Info, X } from 'lucide-react';
import { buildConfidenceMatrix } from '../../utils/uncertaintyUtils';

const UncertaintyMatrixCard = ({ data }) => {
  const [showInfo, setShowInfo] = useState(false);
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
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-base font-semibold text-gray-800">Confidence Matrix</span>
            <button
              onClick={() => setShowInfo(true)}
              className="text-gray-400 hover:text-purple-600 transition-colors"
              title="How to read this matrix"
            >
              <Info size={15} />
            </button>
          </div>
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
        <span>Hover cells for details</span>
      </div>

      {/* Info popup */}
      {showInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowInfo(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Grid size={18} className="text-purple-600" />
                <h3 className="font-semibold text-gray-900">How to Read the Confidence Matrix</h3>
              </div>
              <button onClick={() => setShowInfo(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 text-sm text-gray-600 space-y-3">
              <p>
                This 3x3 heatmap plots each paper by its two confidence dimensions to reveal
                where classification quality is strongest and weakest.
              </p>
              <div className="space-y-2.5">
                <div className="flex gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="text-blue-600 font-bold text-sm leading-none mt-0.5">X-axis</div>
                  <div>
                    <div className="font-medium text-gray-800">Evidence Confidence</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      How complete the paper's metadata is. Weighted sum of: has abstract (35%),
                      has DOI (15%), has venue (15%), has full authors (10%), keyword match (25%).
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="text-green-600 font-bold text-sm leading-none mt-0.5">Y-axis</div>
                  <div>
                    <div className="font-medium text-gray-800">Reasoning Confidence</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      How reliable the LLM classification is likely to be. Currently a heuristic:
                      0.7 with abstract (richer context), 0.4 without (title-only).
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg space-y-1.5">
                <div className="font-medium text-gray-800 text-xs">Reading the cells</div>
                <div className="text-xs text-gray-500 space-y-1">
                  <p><span className="font-medium text-gray-700">Top-right (High/High):</span> Best-supported classifications — rich metadata and reliable reasoning.</p>
                  <p><span className="font-medium text-gray-700">Bottom-left (Low/Low):</span> Least reliable — sparse metadata and weak reasoning signal. Candidates for manual review.</p>
                  <p><span className="font-medium text-gray-700">Color intensity:</span> Darker cells contain more papers. Most entries cluster where abstract availability determines the reasoning tier.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UncertaintyMatrixCard;

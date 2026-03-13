import React, { useState } from 'react';
import { getModelConfig } from '../../config/modelConfig';
import { TIER1_DIMENSIONS, SCORE_COLORS } from '../../config/mclConfig';

const MaturityHeatmap = ({ mclData }) => {
  const [selectedCell, setSelectedCell] = useState(null);
  const models = Object.keys(mclData);

  const getCellColor = (score) => {
    const c = SCORE_COLORS[score] || SCORE_COLORS[0];
    return c.bg;
  };

  const getCellTextColor = (score) => {
    const c = SCORE_COLORS[score] || SCORE_COLORS[0];
    return c.text;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-1">Capability Heatmap</h3>
      <p className="text-sm text-gray-600 mb-4">Models × Dimensions color-coded grid (0-3 scale)</p>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4">
        {[0, 1, 2, 3].map(level => (
          <div key={level} className="flex items-center gap-1.5">
            <span
              className="w-5 h-5 rounded border border-gray-200"
              style={{ backgroundColor: SCORE_COLORS[level].bg }}
            />
            <span className="text-xs text-gray-600">
              {level} – {SCORE_COLORS[level].label}
            </span>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="p-2 text-left text-gray-600 font-semibold sticky left-0 bg-white z-10 min-w-[100px]">
                Model
              </th>
              {TIER1_DIMENSIONS.map(dim => (
                <th
                  key={dim.id}
                  className="p-1.5 text-center text-gray-600 font-medium min-w-[60px]"
                  title={dim.description}
                >
                  <div className="writing-mode-vertical" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: '90px', display: 'flex', alignItems: 'center' }}>
                    {dim.shortLabel}
                  </div>
                </th>
              ))}
              <th className="p-2 text-center text-gray-700 font-semibold min-w-[50px]">Avg</th>
            </tr>
          </thead>
          <tbody>
            {models.map(model => {
              const config = getModelConfig(model);
              const tier1 = mclData[model]?.tier1 || {};
              const scores = Object.values(tier1).map(d => d.score).filter(s => s !== undefined);
              const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '—';

              return (
                <tr key={model} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="p-2 font-semibold sticky left-0 bg-white z-10">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: config?.color }}
                      />
                      {model}
                    </div>
                  </td>
                  {TIER1_DIMENSIONS.map(dim => {
                    const score = tier1[dim.id]?.score;
                    const isSelected = selectedCell?.model === model && selectedCell?.dim === dim.id;
                    return (
                      <td
                        key={dim.id}
                        className={`p-1.5 text-center font-bold cursor-pointer transition-all ${
                          isSelected ? 'ring-2 ring-blue-500' : ''
                        }`}
                        style={{
                          backgroundColor: getCellColor(score),
                          color: getCellTextColor(score),
                        }}
                        onClick={() => setSelectedCell(
                          isSelected ? null : { model, dim: dim.id, score, evidence: tier1[dim.id]?.evidence }
                        )}
                        title={`${model} - ${dim.label}: ${score}/3`}
                      >
                        {score ?? '—'}
                      </td>
                    );
                  })}
                  <td className="p-2 text-center font-bold text-gray-800">{avg}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Evidence panel */}
      {selectedCell && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-sm font-bold text-blue-900">
                {selectedCell.model} — {TIER1_DIMENSIONS.find(d => d.id === selectedCell.dim)?.label}
              </span>
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full"
                    style={{
                      backgroundColor: SCORE_COLORS[selectedCell.score]?.bg,
                      color: SCORE_COLORS[selectedCell.score]?.text
                    }}>
                Level {selectedCell.score}/3
              </span>
            </div>
            <button
              onClick={() => setSelectedCell(null)}
              className="text-blue-400 hover:text-blue-600 text-xs"
            >
              Close
            </button>
          </div>
          <p className="text-sm text-blue-800 mt-2">{selectedCell.evidence || 'No evidence provided.'}</p>
          <p className="text-xs text-blue-600 mt-2 italic">
            Level {selectedCell.score}: {TIER1_DIMENSIONS.find(d => d.id === selectedCell.dim)?.levels[selectedCell.score]}
          </p>
        </div>
      )}
    </div>
  );
};

export default MaturityHeatmap;

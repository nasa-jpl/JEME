// Connection Matrix - Heatmap showing connections between models
import React, { useState } from 'react';
import { Grid, X } from 'lucide-react';
import { getModelConfig } from '../../config/modelConfig';

const ConnectionMatrix = ({ connectionData }) => {
  const [selectedCell, setSelectedCell] = useState(null);

  if (!connectionData || !connectionData.matrix) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-gray-500">Loading connection matrix...</div>
      </div>
    );
  }

  const { matrix, models } = connectionData;

  // Find max value for color scaling
  const maxValue = Math.max(
    ...models.flatMap(model1 =>
      models.map(model2 => matrix[model1][model2].count)
    )
  );

  // Get color based on value - black and white gradient
  const getColor = (value) => {
    if (value === 0) return 'bg-gray-50';

    const intensity = value / maxValue;

    if (intensity > 0.8) return 'bg-gray-900 text-white';
    if (intensity > 0.6) return 'bg-gray-700 text-white';
    if (intensity > 0.4) return 'bg-gray-500 text-white';
    if (intensity > 0.2) return 'bg-gray-300';
    return 'bg-gray-200';
  };

  const handleCellClick = (model1, model2, count) => {
    if (model1 === model2 || count === 0) return;

    setSelectedCell({
      model1,
      model2,
      count,
      papers: matrix[model1][model2].papers
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Grid className="text-purple-600 mr-3" size={24} />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Connection Matrix</h2>
            <p className="text-sm text-gray-600">Heatmap showing shared papers between model pairs</p>
          </div>
        </div>
      </div>

      {/* Matrix */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="p-2 border border-gray-300 bg-gray-100 sticky left-0 z-10 w-32"></th>
                {models.map(model => (
                  <th
                    key={model}
                    className="p-2 border border-gray-300 bg-gray-100 text-xs font-semibold text-gray-700 w-24"
                  >
                    <div className="whitespace-nowrap">{model}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {models.map((model1, rowIndex) => (
                <tr key={model1}>
                  <td className="p-2 border border-gray-300 bg-gray-100 font-semibold text-sm text-gray-700 sticky left-0 z-10 whitespace-nowrap w-32">
                    {model1}
                  </td>
                  {models.map((model2, colIndex) => {
                    const count = matrix[model1][model2].count;
                    const isDiagonal = model1 === model2;
                    const isUpperTriangle = rowIndex < colIndex;

                    // Hide upper triangle cells
                    if (isUpperTriangle) {
                      return (
                        <td
                          key={model2}
                          className="p-2 border border-gray-300 bg-gray-100 w-24"
                        >
                          <div className="text-sm font-semibold">
                          </div>
                        </td>
                      );
                    }

                    return (
                      <td
                        key={model2}
                        className={`
                          p-2 border border-gray-300 text-center cursor-pointer transition-all w-24
                          ${isDiagonal ? 'bg-gray-200' : getColor(count)}
                          ${!isDiagonal && count > 0 ? 'hover:ring-2 hover:ring-gray-700 hover:scale-105' : ''}
                        `}
                        onClick={() => handleCellClick(model1, model2, count)}
                      >
                        <div className="text-sm font-semibold">
                          {isDiagonal ? '—' : count || ''}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Connection Strength:</span>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-50 border border-gray-300 rounded"></div>
            <span className="text-xs text-gray-600">None</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
            <span className="text-xs text-gray-600">Low</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-500 rounded"></div>
            <span className="text-xs text-gray-600">Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-900 rounded"></div>
            <span className="text-xs text-gray-600">High</span>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          Click on a cell to see shared papers
        </div>
      </div>

      {/* Modal for selected cell */}
      {selectedCell && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={() => setSelectedCell(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-3xl my-8 flex flex-col"
            style={{ height: 'calc(100vh - 4rem)', maxHeight: '700px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header - Fixed at top */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0 bg-white rounded-t-lg">
              <div className="flex-1 min-w-0 mr-4">
                <h3 className="text-lg font-bold text-gray-900">
                  {selectedCell.model1} ↔ {selectedCell.model2}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedCell.count} shared papers connecting these models
                </p>
              </div>
              <button
                onClick={() => setSelectedCell(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                title="Close (or click outside)"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4" style={{ minHeight: 0 }}>
              <div className="space-y-3">
                {selectedCell.papers.map((paper, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-400 transition-colors"
                  >
                    <div className="font-semibold text-gray-900 mb-2 text-sm">
                      {paper.title}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">Models:</span>
                        {paper.models.map(model => {
                          const modelConfig = getModelConfig(model);
                          const modelColor = modelConfig?.color || '#8B5CF6';

                          return (
                            <span
                              key={model}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                              style={{ backgroundColor: modelColor }}
                            >
                              {model}
                            </span>
                          );
                        })}
                      </div>
                      {paper.authors && paper.authors.length > 0 && (
                        <div>
                          <span className="font-medium">Authors:</span>{' '}
                          {paper.authors.slice(0, 3).join(', ')}
                          {paper.authors.length > 3 && ` +${paper.authors.length - 3} more`}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-xs">
                        {paper.year && <span>Year: {paper.year}</span>}
                        {paper.citationCount > 0 && <span>Citations: {paper.citationCount}</span>}
                        {paper.venue && <span>Venue: {paper.venue}</span>}
                      </div>
                      {paper.doi && (
                        <div className="mt-2">
                          <a
                            href={`https://doi.org/${paper.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-xs underline"
                          >
                            {paper.doi}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer - Fixed at bottom */}
            <div className="p-3 border-t border-gray-200 bg-gray-50 flex-shrink-0 rounded-b-lg">
              <button
                onClick={() => setSelectedCell(null)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionMatrix;

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { getModelConfig } from '../../config/modelConfig';
import { TIER2_DOMAINS, SCORE_COLORS, calculateTier2DomainAverage } from '../../config/mclConfig';

const Tier2DomainPanel = ({ mclData }) => {
  const [expandedDomain, setExpandedDomain] = useState(null);
  const models = Object.keys(mclData);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-1">Tier 2: Application Domains</h3>
      <p className="text-sm text-gray-600 mb-4">5 domains with 4 sub-dimensions each, scored 0-3</p>

      <div className="space-y-3">
        {TIER2_DOMAINS.map(domain => {
          const isExpanded = expandedDomain === domain.id;

          return (
            <div key={domain.id} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Domain header */}
              <button
                onClick={() => setExpandedDomain(isExpanded ? null : domain.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 text-left">{domain.label}</h4>
                  <p className="text-xs text-gray-500">{domain.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Mini model score pills */}
                  <div className="hidden md:flex items-center gap-1">
                    {models.map(model => {
                      const avg = calculateTier2DomainAverage(mclData[model]?.tier2?.[domain.id]);
                      const config = getModelConfig(model);
                      return (
                        <span
                          key={model}
                          className="text-xs font-medium px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: config?.color + '20',
                            color: config?.color,
                          }}
                          title={`${model}: ${avg.toFixed(1)}`}
                        >
                          {avg.toFixed(1)}
                        </span>
                      );
                    })}
                  </div>
                  {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="border-t border-gray-200 p-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="p-2 text-left text-gray-600 font-semibold">Sub-Dimension</th>
                          {models.map(model => {
                            const config = getModelConfig(model);
                            return (
                              <th key={model} className="p-2 text-center font-medium" style={{ color: config?.color }}>
                                {model}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {domain.subDimensions.map(sub => (
                          <tr key={sub.id} className="border-b border-gray-50">
                            <td className="p-2 text-gray-700 font-medium">{sub.label}</td>
                            {models.map(model => {
                              const score = mclData[model]?.tier2?.[domain.id]?.[sub.id]?.score;
                              const sc = SCORE_COLORS[score] || SCORE_COLORS[0];
                              return (
                                <td key={model} className="p-2 text-center">
                                  <span
                                    className="inline-block px-2 py-0.5 rounded font-bold"
                                    style={{ backgroundColor: sc.bg, color: sc.text }}
                                    title={mclData[model]?.tier2?.[domain.id]?.[sub.id]?.evidence || ''}
                                  >
                                    {score ?? '—'}
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                        {/* Domain average row */}
                        <tr className="border-t-2 border-gray-200 bg-gray-50">
                          <td className="p-2 text-gray-700 font-bold">Domain Average</td>
                          {models.map(model => {
                            const avg = calculateTier2DomainAverage(mclData[model]?.tier2?.[domain.id]);
                            const config = getModelConfig(model);
                            return (
                              <td key={model} className="p-2 text-center font-bold" style={{ color: config?.color }}>
                                {avg.toFixed(1)}
                              </td>
                            );
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Tier2DomainPanel;

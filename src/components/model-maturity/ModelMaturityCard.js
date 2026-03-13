import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { getModelConfig } from '../../config/modelConfig';
import { TIER1_DIMENSIONS, TIER2_DOMAINS, calculateTier1Average, calculateTier2DomainAverage, getReadiness, SCORE_COLORS } from '../../config/mclConfig';

const ModelMaturityCard = ({ modelName, modelData }) => {
  const config = getModelConfig(modelName);
  const tier1Avg = calculateTier1Average(modelData.tier1);
  const readiness = getReadiness(tier1Avg);

  // Mini sparkline of tier 1 scores
  const tier1Scores = TIER1_DIMENSIONS.map(dim => modelData.tier1?.[dim.id]?.score ?? 0);

  // Tier 2 domain averages
  const tier2Avgs = TIER2_DOMAINS.map(domain => ({
    label: domain.shortLabel,
    avg: calculateTier2DomainAverage(modelData.tier2?.[domain.id]),
  }));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full" style={{ backgroundColor: config?.color }} />
          <h3 className="font-bold text-gray-900">{modelName}</h3>
        </div>
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: readiness.color + '20', color: readiness.color }}
        >
          {readiness.label}
        </span>
      </div>

      <p className="text-xs text-gray-500 mb-3 line-clamp-1">{config?.description}</p>

      {/* Overall score */}
      <div className="flex items-center gap-3 mb-3">
        <div className="text-2xl font-bold" style={{ color: config?.color }}>
          {tier1Avg.toFixed(1)}
        </div>
        <div>
          <p className="text-xs text-gray-500">Tier 1 Average</p>
          <p className="text-xs text-gray-400">out of 3.0</p>
        </div>
      </div>

      {/* Mini bar chart of tier 1 scores */}
      <div className="flex items-end gap-0.5 h-8 mb-3">
        {tier1Scores.map((score, i) => (
          <div
            key={i}
            className="flex-1 rounded-t transition-all"
            style={{
              height: `${(score / 3) * 100}%`,
              backgroundColor: SCORE_COLORS[score]?.bg || '#F3F4F6',
              border: `1px solid ${SCORE_COLORS[score]?.text || '#E5E7EB'}40`,
              minHeight: '2px',
            }}
            title={`${TIER1_DIMENSIONS[i]?.shortLabel}: ${score}/3`}
          />
        ))}
      </div>

      {/* Tier 2 domain scores */}
      <div className="space-y-1.5 mb-3">
        {tier2Avgs.map(({ label, avg }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-20 truncate">{label}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all"
                style={{
                  width: `${(avg / 3) * 100}%`,
                  backgroundColor: config?.color || '#6B7280',
                  opacity: 0.7,
                }}
              />
            </div>
            <span className="text-xs font-medium text-gray-600 w-6 text-right">{avg.toFixed(1)}</span>
          </div>
        ))}
      </div>

      {/* Detail link */}
      <Link
        to={`/science-model-dashboard/${modelName}/maturity`}
        className="flex items-center justify-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 mt-2 py-1.5 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
      >
        View Details <ChevronRight size={12} />
      </Link>
    </div>
  );
};

export default ModelMaturityCard;

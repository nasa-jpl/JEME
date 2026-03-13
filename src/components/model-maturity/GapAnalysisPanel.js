import React from 'react';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import { TIER1_DIMENSIONS, TIER2_DOMAINS, SCORE_COLORS } from '../../config/mclConfig';

const GapAnalysisPanel = ({ modelData, modelColor }) => {
  // Find dimensions scoring below 2
  const tier1Gaps = TIER1_DIMENSIONS
    .map(dim => ({
      ...dim,
      score: modelData.tier1?.[dim.id]?.score ?? 0,
      evidence: modelData.tier1?.[dim.id]?.evidence,
    }))
    .filter(d => d.score < 2)
    .sort((a, b) => a.score - b.score);

  // Find tier 2 sub-dimension gaps
  const tier2Gaps = [];
  TIER2_DOMAINS.forEach(domain => {
    domain.subDimensions.forEach(sub => {
      const score = modelData.tier2?.[domain.id]?.[sub.id]?.score ?? 0;
      if (score < 2) {
        tier2Gaps.push({
          domain: domain.label,
          subDim: sub.label,
          score,
        });
      }
    });
  });

  // Find strengths (score 3)
  const strengths = TIER1_DIMENSIONS
    .map(dim => ({
      ...dim,
      score: modelData.tier1?.[dim.id]?.score ?? 0,
    }))
    .filter(d => d.score === 3);

  if (tier1Gaps.length === 0 && tier2Gaps.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-green-700">
          <TrendingUp size={20} />
          <span className="font-semibold">No significant capability gaps identified.</span>
        </div>
        <p className="text-sm text-green-600 mt-1">All Tier 1 dimensions score at Level 2 or above.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-1">Gap Analysis</h3>
      <p className="text-sm text-gray-600 mb-4">Dimensions scoring below Level 2 and improvement suggestions</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gaps */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-amber-500" />
            <h4 className="text-sm font-semibold text-gray-700">
              Improvement Areas ({tier1Gaps.length} Tier 1, {tier2Gaps.length} Tier 2)
            </h4>
          </div>
          <div className="space-y-2">
            {tier1Gaps.map(gap => (
              <div key={gap.id} className="p-3 rounded-lg border border-amber-200 bg-amber-50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">{gap.label}</span>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded"
                    style={{ backgroundColor: SCORE_COLORS[gap.score]?.bg, color: SCORE_COLORS[gap.score]?.text }}
                  >
                    Level {gap.score}
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  <strong>Current:</strong> {gap.levels[gap.score]}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  <strong>Next level:</strong> {gap.levels[Math.min(gap.score + 1, 3)]}
                </p>
              </div>
            ))}
            {tier2Gaps.slice(0, 5).map((gap, i) => (
              <div key={i} className="p-2 rounded border border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-700">
                    <span className="font-medium">{gap.domain}</span> → {gap.subDim}
                  </span>
                  <span
                    className="text-xs font-bold px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: SCORE_COLORS[gap.score]?.bg, color: SCORE_COLORS[gap.score]?.text }}
                  >
                    {gap.score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strengths */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-green-500" />
            <h4 className="text-sm font-semibold text-gray-700">
              Strengths ({strengths.length} at Level 3)
            </h4>
          </div>
          <div className="space-y-2">
            {strengths.map(s => (
              <div key={s.id} className="p-3 rounded-lg border border-green-200 bg-green-50">
                <span className="text-sm font-medium text-green-800">{s.label}</span>
                <p className="text-xs text-green-700 mt-0.5">{s.levels[3]}</p>
              </div>
            ))}
            {strengths.length === 0 && (
              <p className="text-sm text-gray-500 italic">No dimensions at Level 3 yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GapAnalysisPanel;

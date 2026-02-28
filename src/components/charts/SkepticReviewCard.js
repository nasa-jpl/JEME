// src/components/charts/SkepticReviewCard.js
// Summary and override table for Phase 3 skeptic agent reviews

import React, { useMemo } from 'react';
import { ShieldAlert, CheckCircle, XCircle } from 'lucide-react';

const SkepticReviewCard = ({ data }) => {
  const { stats, overrideEntries } = useMemo(() => {
    if (!data || !Array.isArray(data)) return { stats: null, overrideEntries: [] };

    let reviewed = 0;
    let overrides = 0;
    let agreementSum = 0;
    const flagged = [];

    // Count by reason
    const reasonCounts = {};

    data.forEach(entry => {
      const sr = entry.uncertainty?.skeptic_review;
      if (!sr || !sr.reviewed) return;

      reviewed++;
      if (sr.skeptic_agreement !== null && sr.skeptic_agreement !== undefined) {
        agreementSum += sr.skeptic_agreement;
      }

      const reason = sr.review_reason || 'unknown';
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;

      if (sr.override_flag) {
        overrides++;
        let title = entry.title;
        if (Array.isArray(title)) title = title[0] || '';
        flagged.push({
          title: title || '(untitled)',
          originalEngagement: entry.engagement_level || 'Unknown',
          originalDomain: entry.research_domain || 'Unknown',
          skepticEngagement: sr.skeptic_engagement || 'Unknown',
          skepticDomain: sr.skeptic_domain || 'Unknown',
          agreement: sr.skeptic_agreement,
          reason: reason,
        });
      }
    });

    if (reviewed === 0) return { stats: null, overrideEntries: [] };

    return {
      stats: {
        reviewed,
        overrides,
        avgAgreement: parseFloat((agreementSum / reviewed).toFixed(3)),
        avgAgreementPct: Math.round((agreementSum / reviewed) * 100),
        reasonCounts,
      },
      overrideEntries: flagged,
    };
  }, [data]);

  if (!stats) return null;

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <ShieldAlert size={20} className="text-orange-600" />
        <div>
          <div className="text-base font-semibold text-gray-800">Skeptic Review</div>
          <div className="text-sm text-gray-500">
            Adversarial review of {stats.reviewed.toLocaleString()} high-risk entries
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-800">{stats.reviewed.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-1">Entries reviewed</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.overrides}</div>
          <div className="text-xs text-gray-500 mt-1">Overrides flagged</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.avgAgreementPct}%</div>
          <div className="text-xs text-gray-500 mt-1">Avg agreement</div>
        </div>
      </div>

      {/* Review reasons breakdown */}
      {Object.keys(stats.reasonCounts).length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Review triggers</div>
          <div className="space-y-1.5">
            {Object.entries(stats.reasonCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([reason, count]) => (
                <div key={reason} className="flex justify-between text-xs">
                  <span className="text-gray-600">{reason.replace(/_/g, ' ')}</span>
                  <span className="font-medium text-gray-800">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Override table */}
      {overrideEntries.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="text-sm font-medium text-gray-700 mb-2">
            <XCircle size={14} className="inline text-red-500 mr-1" />
            Override-flagged entries ({overrideEntries.length})
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-2 text-gray-500 font-medium">Title</th>
                  <th className="text-left py-2 px-2 text-gray-500 font-medium">Original</th>
                  <th className="text-left py-2 px-2 text-gray-500 font-medium">Skeptic</th>
                  <th className="text-right py-2 pl-2 text-gray-500 font-medium">Agree</th>
                </tr>
              </thead>
              <tbody>
                {overrideEntries.slice(0, 10).map((entry, idx) => (
                  <tr key={idx} className="border-b border-gray-50 hover:bg-red-50">
                    <td className="py-2 pr-2 text-gray-700 max-w-xs truncate" title={entry.title}>
                      {entry.title.length > 60 ? entry.title.slice(0, 60) + '...' : entry.title}
                    </td>
                    <td className="py-2 px-2 text-gray-600 whitespace-nowrap">
                      {entry.originalEngagement.replace('Level ', 'L').split(':')[0]}
                    </td>
                    <td className="py-2 px-2 text-orange-700 whitespace-nowrap">
                      {entry.skepticEngagement.replace('Level ', 'L').split(':')[0]}
                    </td>
                    <td className="py-2 pl-2 text-right font-medium text-red-600">
                      {entry.agreement !== null ? `${Math.round(entry.agreement * 100)}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {overrideEntries.length > 10 && (
              <div className="text-xs text-gray-400 mt-2 text-center">
                Showing 10 of {overrideEntries.length} overrides
              </div>
            )}
          </div>
        </div>
      )}

      {/* All clear message */}
      {overrideEntries.length === 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2 text-sm text-green-700">
          <CheckCircle size={16} className="text-green-500" />
          No overrides flagged — skeptic agent agrees with existing classifications
        </div>
      )}
    </div>
  );
};

export default SkepticReviewCard;

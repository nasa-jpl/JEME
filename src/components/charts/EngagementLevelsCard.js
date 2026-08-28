// src/components/charts/EngagementLevelsCard.js
// Chart showing engagement level distribution

import React, { useMemo } from 'react';
import { MoreHorizontal } from 'lucide-react';
import {
  ENGAGEMENT_COLORS,
  ENGAGEMENT_LABELS,
  ENGAGEMENT_DESCRIPTIONS,
  getEngagementTier,
  isMissionFormat as detectMissionFormat,
} from '../../utils/engagementLabels';

const EngagementLevelsCard = ({ data }) => {
  // Process the engagement levels data
  const engagementData = useMemo(() => {
    const citationsData = data || [];
    const missionFormat = detectMissionFormat(citationsData);

    // Count citations by engagement tier
    const engagementCounts = {};
    citationsData.forEach(paper => {
      const tier = getEngagementTier(paper.engagement_level, missionFormat);
      engagementCounts[tier] = (engagementCounts[tier] || 0) + 1;
    });

    const tierOrder = missionFormat
      ? ['Citation', 'Data Usage', 'Review Paper', 'Unclassified']
      : ['L1', 'L2', 'L3', 'Unclassified'];

    return tierOrder
      .map(tier => {
        const count = engagementCounts[tier] || 0;
        return {
          name: ENGAGEMENT_LABELS[tier],
          tier,
          fullName: ENGAGEMENT_LABELS[tier],
          value: count,
          color: ENGAGEMENT_COLORS[tier],
          percentage: count > 0 ? ((count / citationsData.length) * 100).toFixed(1) : "0.0"
        };
      })
      .filter(item => item.value > 0); // Only show levels that have citations
  }, [data]);

  const unclassifiedCount = engagementData.find(item => item.tier === "Unclassified")?.value || 0;

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm h-full">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-base font-semibold text-gray-800">Engagement Level Classification</div>
          <div className="text-sm text-gray-500 mt-1">
            How deeply each citation engages with this model/mission • {(data || []).length.toLocaleString()} total citations
          </div>
        </div>
        <button className="text-gray-500 hover:text-gray-700 p-1">
          <MoreHorizontal size={18} />
        </button>
      </div>

      <div className="mb-4">

        {/* Progress indicators for each level */}
        <div className="space-y-2">
          {engagementData.filter(item => item.tier !== "Unclassified").map((item, index) => (
            <div key={index} className="flex items-center">
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-gray-700">{item.name}</span>
                  <span className="text-xs text-gray-500">{item.value.toLocaleString()} citations</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-100 rounded-lg p-4">
        <div className="text-sm font-semibold text-gray-700 mb-2">Engagement Level Definitions</div>
        <div className="space-y-1 text-xs text-gray-600">
          {engagementData.filter(item => item.tier !== "Unclassified").map((item, index, arr) => (
            <div key={item.tier} className={`flex justify-between py-1 ${index < arr.length - 1 ? 'border-b border-dashed border-gray-200' : ''}`}>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                <span>{item.fullName}</span>
              </div>
              <div className="text-right max-w-xs">{ENGAGEMENT_DESCRIPTIONS[item.tier]}</div>
            </div>
          ))}
        </div>

        {unclassifiedCount > 0 && (
          <div className="mt-3 pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              <span className="font-medium">{unclassifiedCount.toLocaleString()} citations</span> are not yet classified by engagement level
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EngagementLevelsCard;

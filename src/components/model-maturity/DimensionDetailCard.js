import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { SCORE_COLORS } from '../../config/mclConfig';

const DimensionDetailCard = ({ dimension, scoreData, modelColor }) => {
  const [expanded, setExpanded] = useState(false);
  const score = scoreData?.score ?? 0;
  const sc = SCORE_COLORS[score] || SCORE_COLORS[0];

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {/* Score gauge */}
          <div className="flex items-center gap-0.5">
            {[0, 1, 2, 3].map(level => (
              <div
                key={level}
                className="w-5 h-5 rounded"
                style={{
                  backgroundColor: level <= score ? (modelColor || sc.text) : '#F3F4F6',
                  opacity: level <= score ? 0.8 : 0.3,
                }}
              />
            ))}
          </div>
          <div className="text-left">
            <h4 className="text-sm font-semibold text-gray-900">{dimension.label}</h4>
            <p className="text-xs text-gray-500">{dimension.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded"
            style={{ backgroundColor: sc.bg, color: sc.text }}
          >
            {score}/3 – {sc.label}
          </span>
          {expanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          {/* Level descriptor */}
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-600 mb-1">Level {score} Criteria:</p>
            <p className="text-sm text-gray-700">{dimension.levels[score]}</p>
          </div>

          {/* Evidence */}
          {scoreData?.evidence && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1">Evidence:</p>
              <p className="text-sm text-gray-700">{scoreData.evidence}</p>
            </div>
          )}

          {/* All levels for reference */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-500 mb-2">All Levels:</p>
            <div className="space-y-1">
              {dimension.levels.map((desc, i) => (
                <div key={i} className={`flex items-start gap-2 text-xs ${i === score ? 'font-semibold' : 'text-gray-500'}`}>
                  <span
                    className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold mt-0.5"
                    style={{
                      backgroundColor: i === score ? (modelColor || sc.text) : '#D1D5DB',
                    }}
                  >
                    {i}
                  </span>
                  <span>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DimensionDetailCard;

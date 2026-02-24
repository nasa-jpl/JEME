// src/components/UncertaintyBadge.js
// Inline confidence indicator shown next to engagement levels in tables

import React from 'react';
import { getConfidenceColor, getConfidenceLabel } from '../utils/uncertaintyUtils';

const UncertaintyBadge = ({ uncertainty }) => {
  if (!uncertainty) return null;

  const score = uncertainty.composite_confidence ?? uncertainty.compositeConfidence;
  if (score === null || score === undefined) return null;

  const pct = Math.round(score * 100);
  const color = getConfidenceColor(score);
  const label = getConfidenceLabel(score);

  return (
    <span
      className="inline-flex items-center gap-1"
      title={`Confidence: ${pct}% (${label})`}
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs text-gray-500">{pct}%</span>
    </span>
  );
};

export default UncertaintyBadge;

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

  // Two axes: evidence (how much there was to read) and reasoning (how sure the
  // classifier was). A low score flags an uncertain classification, not a weak paper.
  const tooltip =
    `${pct}% confidence (${label}) in this engagement-level classification.\n` +
    'Combines evidence (how much metadata was available to read: abstract, DOI, venue, authors) ' +
    'with reasoning (how sure the classifier was of the label).\n' +
    'Low confidence means the classification is uncertain, not that the paper is weak. ' +
    'Review these first when validating.';

  return (
    <span
      className="inline-flex items-center gap-1 cursor-help"
      title={tooltip}
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

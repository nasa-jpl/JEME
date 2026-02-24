// src/utils/uncertaintyUtils.js
// Utility functions for uncertainty quantification processing

/**
 * Safely extract uncertainty data from a citation entry.
 * Returns null defaults for entries without uncertainty data (backward-compatible).
 * @param {Object} entry - Citation entry (raw or extracted)
 * @returns {Object|null} Uncertainty data or null
 */
export const extractUncertainty = (entry) => {
  if (!entry || !entry.uncertainty) return null;
  const u = entry.uncertainty;
  return {
    reasoningConfidence: u.reasoning_confidence ?? null,
    evidenceConfidence: u.evidence_confidence ?? null,
    compositeConfidence: u.composite_confidence ?? null,
    evidenceFlags: u.evidence_flags || {},
    classificationProvenance: u.classification_provenance || {},
    errorEstimates: u.error_estimates || {}
  };
};

/**
 * Calculate aggregate uncertainty metrics across all citation entries.
 * @param {Array} citationsData - Raw citation data array
 * @returns {Object} Aggregate uncertainty statistics
 */
export const calculateUncertaintyMetrics = (citationsData) => {
  if (!citationsData || !Array.isArray(citationsData) || citationsData.length === 0) {
    return null;
  }

  const entriesWithUncertainty = citationsData.filter(e => e.uncertainty);
  if (entriesWithUncertainty.length === 0) return null;

  const total = entriesWithUncertainty.length;

  // Aggregate composite confidence
  let sumComposite = 0;
  let sumEvidence = 0;
  let sumReasoning = 0;
  let highCount = 0;
  let moderateCount = 0;
  let lowCount = 0;
  let veryLowCount = 0;
  let abstractCount = 0;
  let miscHigh = 0;
  let miscMedium = 0;
  let miscLow = 0;

  // Per engagement level and per domain
  const byEngagement = {};
  const byDomain = {};

  entriesWithUncertainty.forEach(entry => {
    const u = entry.uncertainty;
    const comp = u.composite_confidence;
    const evid = u.evidence_confidence;
    const reas = u.reasoning_confidence;

    sumComposite += comp;
    sumEvidence += evid;
    sumReasoning += reas;

    if (comp >= 0.7) highCount++;
    else if (comp >= 0.5) moderateCount++;
    else if (comp >= 0.3) lowCount++;
    else veryLowCount++;

    if (u.evidence_flags && u.evidence_flags.has_abstract) abstractCount++;

    const risk = u.error_estimates?.miscalibration_risk;
    if (risk === 'high') miscHigh++;
    else if (risk === 'medium') miscMedium++;
    else miscLow++;

    // By engagement
    const engagement = entry.engagement_level || 'Unknown';
    if (!byEngagement[engagement]) {
      byEngagement[engagement] = { sum: 0, count: 0 };
    }
    byEngagement[engagement].sum += comp;
    byEngagement[engagement].count += 1;

    // By domain
    const domain = entry.research_domain || 'Unknown';
    if (!byDomain[domain]) {
      byDomain[domain] = { sum: 0, count: 0 };
    }
    byDomain[domain].sum += comp;
    byDomain[domain].count += 1;
  });

  // Compute per-engagement averages
  const confidenceByEngagement = Object.entries(byEngagement).map(([level, data]) => ({
    level,
    avgConfidence: data.count > 0 ? parseFloat((data.sum / data.count).toFixed(3)) : 0,
    count: data.count
  })).sort((a, b) => a.level.localeCompare(b.level));

  // Compute per-domain averages
  const confidenceByDomain = Object.entries(byDomain).map(([domain, data]) => ({
    domain,
    avgConfidence: data.count > 0 ? parseFloat((data.sum / data.count).toFixed(3)) : 0,
    count: data.count
  })).sort((a, b) => b.count - a.count);

  return {
    totalWithUncertainty: total,
    avgComposite: parseFloat((sumComposite / total).toFixed(3)),
    avgEvidence: parseFloat((sumEvidence / total).toFixed(3)),
    avgReasoning: parseFloat((sumReasoning / total).toFixed(3)),
    highCount,
    moderateCount,
    lowCount,
    veryLowCount,
    abstractCoverage: parseFloat((abstractCount / total).toFixed(3)),
    abstractCount,
    miscalibrationDistribution: {
      high: miscHigh,
      medium: miscMedium,
      low: miscLow
    },
    confidenceByEngagement,
    confidenceByDomain
  };
};

/**
 * Map a confidence score to a display color.
 * @param {number|null} score - Confidence score 0-1
 * @returns {string} CSS color value
 */
export const getConfidenceColor = (score) => {
  if (score === null || score === undefined) return '#9CA3AF'; // gray-400
  if (score >= 0.7) return '#22C55E'; // green-500
  if (score >= 0.5) return '#F59E0B'; // amber-500
  if (score >= 0.3) return '#F97316'; // orange-500
  return '#EF4444'; // red-500
};

/**
 * Map a confidence score to a human-readable label.
 * @param {number|null} score - Confidence score 0-1
 * @returns {string} Label
 */
export const getConfidenceLabel = (score) => {
  if (score === null || score === undefined) return 'No Data';
  if (score >= 0.7) return 'High';
  if (score >= 0.5) return 'Moderate';
  if (score >= 0.3) return 'Low';
  return 'Very Low';
};

/**
 * Bucket confidence scores into histogram bins.
 * @param {Array} entries - Citation entries with uncertainty data
 * @returns {Array} Array of bucket objects for chart rendering
 */
export const bucketConfidenceScores = (entries) => {
  const buckets = [
    { range: '0.0-0.2', min: 0, max: 0.2, count: 0, label: 'Very Low', color: '#EF4444' },
    { range: '0.2-0.4', min: 0.2, max: 0.4, count: 0, label: 'Low', color: '#F97316' },
    { range: '0.4-0.6', min: 0.4, max: 0.6, count: 0, label: 'Moderate', color: '#F59E0B' },
    { range: '0.6-0.8', min: 0.6, max: 0.8, count: 0, label: 'Good', color: '#84CC16' },
    { range: '0.8-1.0', min: 0.8, max: 1.01, count: 0, label: 'High', color: '#22C55E' },
  ];

  if (!entries || !Array.isArray(entries)) return buckets;

  entries.forEach(entry => {
    const u = entry.uncertainty;
    if (!u) return;
    const score = u.composite_confidence;
    if (score === null || score === undefined) return;
    for (const bucket of buckets) {
      if (score >= bucket.min && score < bucket.max) {
        bucket.count++;
        break;
      }
    }
  });

  return buckets;
};

/**
 * Build 2D matrix data for reasoning x evidence heatmap.
 * @param {Array} entries - Citation entries with uncertainty data
 * @returns {Object} Matrix data with rows, cols, and cell counts
 */
export const buildConfidenceMatrix = (entries) => {
  const bins = [
    { label: 'Low (<0.4)', min: 0, max: 0.4 },
    { label: 'Med (0.4-0.7)', min: 0.4, max: 0.7 },
    { label: 'High (>=0.7)', min: 0.7, max: 1.01 },
  ];

  // Initialize 3x3 grid
  const matrix = bins.map(() => bins.map(() => 0));
  let maxCount = 0;

  if (entries && Array.isArray(entries)) {
    entries.forEach(entry => {
      const u = entry.uncertainty;
      if (!u) return;
      const ev = u.evidence_confidence;
      const re = u.reasoning_confidence;
      if (ev === null || ev === undefined || re === null || re === undefined) return;

      const colIdx = bins.findIndex(b => ev >= b.min && ev < b.max);
      const rowIdx = bins.findIndex(b => re >= b.min && re < b.max);
      if (colIdx >= 0 && rowIdx >= 0) {
        matrix[rowIdx][colIdx]++;
        if (matrix[rowIdx][colIdx] > maxCount) {
          maxCount = matrix[rowIdx][colIdx];
        }
      }
    });
  }

  return {
    rowLabels: bins.map(b => b.label),
    colLabels: bins.map(b => b.label),
    matrix,
    maxCount
  };
};

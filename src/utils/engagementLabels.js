// src/utils/engagementLabels.js
// Single source of truth for how engagement-level classifications are displayed.
//
// The raw `engagement_level` strings in the data are inconsistent ("Citation",
// "Level 1: Simple Citation", "Level 1: Data Usage", "Level 2: Data Usage", ...),
// so everything that renders a level should normalize through here. The tier is
// decided by the "Level N" prefix, matching how the metric cards count them.
//
// Model format  : L1 / L2 / L3
// Mission format: Citation / Data Usage / Review Paper

export const ENGAGEMENT_TIERS = ['L1', 'L2', 'L3'];

// Long form, used in legends, table cells, and definition lists.
// Models get the L1/L2/L3 prefixes; missions use their own parallel vocabulary,
// which has no "model adaptation" tier and so is not numbered.
export const ENGAGEMENT_LABELS = {
  L1: 'L1: Citation only',
  L2: 'L2: Data Usage',
  L3: 'L3: Model Adaptation',
  Citation: 'Citation only',
  'Data Usage': 'Data Usage',
  'Review Paper': 'Review Paper',
  Unclassified: 'Unclassified',
};

// Short form, used where horizontal space is tight (chart axes).
export const ENGAGEMENT_SHORT_LABELS = {
  L1: 'L1',
  L2: 'L2',
  L3: 'L3',
  Citation: 'Citation',
  'Data Usage': 'Data Usage',
  'Review Paper': 'Review',
  Unclassified: 'Unclassified',
};

export const ENGAGEMENT_DESCRIPTIONS = {
  L1: 'Cites a team paper as background, with no direct use of the model or its outputs',
  L2: 'Uses model outputs or datasets',
  L3: 'Uses, modifies, extends, or couples the model or methodology',
  Citation: 'Mentions or cites mission products in passing without direct data use',
  'Data Usage': 'Uses mission data or products in analysis',
  'Review Paper': 'Review, survey, or overview paper',
};

export const ENGAGEMENT_COLORS = {
  L1: '#93C5FD',
  L2: '#60A5FA',
  L3: '#1D4ED8',
  Citation: '#93C5FD',
  'Data Usage': '#3B82F6',
  'Review Paper': '#1D4ED8',
  Unclassified: '#D1D5DB',
};

/**
 * True when a dataset uses the mission engagement vocabulary rather than L1/L2/L3.
 * @param {Array} data - citation entries
 */
export const isMissionFormat = (data = []) =>
  (data || []).some((paper) => {
    const level = paper?.engagement_level || '';
    return level === 'Data Usage' || level === 'Review Paper';
  });

/**
 * Normalize a raw engagement_level string to a tier key.
 * @param {string} level - raw engagement_level from the data
 * @param {boolean} missionFormat - whether the dataset uses mission vocabulary
 * @returns {string} 'L1' | 'L2' | 'L3' | 'Citation' | 'Data Usage' | 'Review Paper' | 'Unclassified'
 */
export const getEngagementTier = (level, missionFormat = false) => {
  if (!level || level === 'Unknown' || level === 'Not specified') return 'Unclassified';

  if (missionFormat) {
    if (level === 'Data Usage') return 'Data Usage';
    if (level === 'Review Paper') return 'Review Paper';
    if (level === 'Citation' || level === 'Simple Citation') return 'Citation';
    return 'Unclassified';
  }

  if (level === 'Citation' || level === 'Simple Citation') return 'L1';
  if (level.startsWith('Level 1:') || level.startsWith('Level 1 ')) return 'L1';
  if (level.startsWith('Level 2:') || level.startsWith('Level 2 ')) return 'L2';
  if (level.startsWith('Level 3:') || level.startsWith('Level 3 ')) return 'L3';
  return 'Unclassified';
};

/**
 * Display label for a raw engagement_level string.
 * @param {string} level - raw engagement_level from the data
 * @param {boolean} missionFormat - whether the dataset uses mission vocabulary
 */
export const getEngagementDisplayLabel = (level, missionFormat = false) => {
  const tier = getEngagementTier(level, missionFormat);
  return ENGAGEMENT_LABELS[tier] || 'Unclassified';
};

export const getEngagementDescription = (tier) => ENGAGEMENT_DESCRIPTIONS[tier] || '';

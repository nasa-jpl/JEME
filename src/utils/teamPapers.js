// src/utils/teamPapers.js
// Loading and matching helpers for a model's team-paper list.
//
// The citation corpus is "every peer-reviewed paper that cites a team paper",
// which includes a small share (2-5% across models) of the team's OWN later
// papers citing their earlier ones. Callers use this to state that explicitly
// rather than implying every citation comes from an outside group.

// File names are historically inconsistent (some lowercase, some uppercase).
const TEAM_PAPER_FILES = {
  RAPID: 'rapid_team_papers.json',
  'CMS-Flux': 'cms_flux_team_papers.json',
  ECCO: 'ecco_team_papers.json',
  ISSM: 'issm_team_papers.json',
  'MOMO-CHEM': 'momo_chem_team_papers.json',
  CARDAMOM: 'cardamom_team_papers.json',
  LES: 'LES_team_papers.json',
  EDMF: 'EDMF_team_papers.json',
  GRACE: 'grace_team_papers.json',
  SWOT: 'swot_team_papers.json',
  TROPESS: 'tropess_team_papers.json',
};

const norm = (value) => {
  const s = Array.isArray(value) ? value[0] : value;
  return String(s || '').trim().toLowerCase().replace(/\.$/, '');
};

/**
 * Load a model's team papers.
 * The files wrap the list under either the model name or a `papers` key, so
 * take whichever property holds the array.
 * @param {string} modelName
 * @returns {Promise<Array>} team paper objects (empty array on any failure)
 */
export const loadTeamPapers = async (modelName) => {
  const file = TEAM_PAPER_FILES[modelName];
  if (!file) return [];
  try {
    const response = await fetch(`${process.env.PUBLIC_URL}/data/${file}`);
    if (!response.ok) return [];
    const json = await response.json();
    if (Array.isArray(json)) return json;
    return Object.values(json).find(Array.isArray) || [];
  } catch (error) {
    console.error(`Failed to load team papers for ${modelName}:`, error);
    return [];
  }
};

/**
 * Count how many entries in the citation corpus are themselves team papers.
 * Matches on DOI first, falling back to exact normalized title.
 * @param {Array} citations
 * @param {Array} teamPapers
 * @returns {number}
 */
export const countTeamPaperCitations = (citations, teamPapers) => {
  if (!citations?.length || !teamPapers?.length) return 0;

  const dois = new Set();
  const titles = new Set();
  teamPapers.forEach((paper) => {
    if (paper?.doi) dois.add(norm(paper.doi));
    if (paper?.title) titles.add(norm(paper.title));
  });

  return citations.reduce((count, entry) => {
    const doi = norm(entry.doi || entry.DOI);
    const title = norm(entry.title);
    const isTeamPaper = (doi && dois.has(doi)) || (title && titles.has(title));
    return count + (isTeamPaper ? 1 : 0);
  }, 0);
};

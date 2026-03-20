// Earth System Classifier
// Maps research domains and papers to Earth's five major spheres:
// Atmosphere, Hydrosphere, Cryosphere, Biosphere, Geosphere
//
// Performance: Optimized for large datasets (ECCO has 27K+ entries).
// Uses domain-first classification with model affinity fallback.
// Avoids copying paper objects — stores only lightweight references.

const SPHERE_DEFINITIONS = {
  Atmosphere: {
    color: '#F97316',
    icon: 'Cloud',
    description: 'Atmospheric sciences including chemistry, weather, turbulence, and air quality',
    domainKeywords: [
      'atmospheric', 'aerosol', 'air quality', 'ozone', 'stratospheric',
      'chemical transport', 'climate-chemistry', 'wildfire', 'biomass burning',
      'boundary layer', 'turbulence', 'convection', 'cloud', 'stratocumulus',
      'parameterization', 'tropical cyclone', 'weather prediction', 'nwp',
      'wind', 'urban', 'methane detection', 'plume', 'radiation',
      'co2 inversion', 'fossil fuel', 'urban emission', 'trace gas',
      'satellite atmospheric', 'general atmospheric'
    ],
    modelAffinity: {
      'MOMO-CHEM': 1.0, 'LES': 1.0, 'EDMF': 1.0, 'CMS-Flux': 0.3, 'CARDAMOM': 0.2,
    }
  },
  Hydrosphere: {
    color: '#3B82F6',
    icon: 'Droplets',
    description: 'Water systems including rivers, oceans, precipitation, and water resources',
    domainKeywords: [
      'hydrol', 'river', 'discharge', 'flood', 'water resource', 'watershed',
      'catchment', 'groundwater', 'aquifer', 'precipitation', 'water cycle',
      'ocean circulation', 'ocean heat', 'ocean model', 'sea level',
      'satellite ocean', 'mesoscale', 'submesoscale', 'coastal', 'regional ocean',
      'ocean surface', 'altimetry', 'reservoir', 'lake', 'estuarin',
      'ocean carbon', 'marine biogeo', 'ocean-ice',
      'remote sensing application'
    ],
    modelAffinity: {
      'RAPID': 1.0, 'ECCO': 0.9, 'SWOT': 0.8, 'GRACE': 0.3,
    }
  },
  Cryosphere: {
    color: '#67E8F9',
    icon: 'Snowflake',
    description: 'Frozen water systems including ice sheets, glaciers, permafrost, and sea ice',
    domainKeywords: [
      'ice sheet', 'glacier', 'ice shelf', 'calving', 'firn', 'snow',
      'subglacial', 'basal', 'ice dynamic', 'ice flow', 'ice model',
      'sea ice', 'polar ocean', 'ice-ocean', 'arctic', 'polar',
      'permafrost', 'cryosphere', 'mass balance', 'remote sensing of ice',
      'sea level contribution', 'ocean-ice'
    ],
    modelAffinity: {
      'ISSM': 1.0, 'ECCO': 0.3, 'GRACE': 0.3, 'CARDAMOM': 0.1,
    }
  },
  Biosphere: {
    color: '#34D399',
    icon: 'TreePine',
    description: 'Living systems including ecosystems, vegetation, carbon cycle, and biodiversity',
    domainKeywords: [
      'carbon cycle', 'carbon data', 'terrestrial carbon', 'vegetation',
      'forest', 'ecosystem', 'biomass', 'fire', 'disturbance ecology',
      'land use', 'land cover', 'remote sensing of ecosystem', 'soil',
      'peatland', 'carbon budget', 'carbon flux', 'co2 flux',
      'land-atmosphere', 'carbon monitor', 'satellite carbon',
      'methane', 'health', 'biogeochem'
    ],
    modelAffinity: {
      'CARDAMOM': 1.0, 'CMS-Flux': 0.8, 'ECCO': 0.1,
    }
  },
  Geosphere: {
    color: '#F59E0B',
    icon: 'Mountain',
    description: 'Solid Earth including tectonics, geology, geodesy, and land surface processes',
    domainKeywords: [
      'solid earth', 'geodesy', 'geodes', 'magnetic field', 'bathymetry',
      'seafloor', 'tecton', 'seismic', 'gravity', 'geoid',
      'processing/algorithm', 'land surface'
    ],
    modelAffinity: {
      'GRACE': 0.6, 'SWOT': 0.2,
    }
  }
};

// Pre-build a domain->sphere lookup cache for fast O(1) classification
// Maps lowercase research_domain strings to { primary, all[] }
const _domainCache = new Map();

function _buildDomainCacheEntry(domain) {
  const domainLower = domain.toLowerCase();
  const scores = {};
  for (const [sphere, def] of Object.entries(SPHERE_DEFINITIONS)) {
    for (const kw of def.domainKeywords) {
      if (domainLower.includes(kw)) {
        scores[sphere] = (scores[sphere] || 0) + 3;
      }
    }
  }
  const allSpheres = Object.keys(scores);
  let primary = null;
  let maxScore = 0;
  for (const [s, sc] of Object.entries(scores)) {
    if (sc > maxScore) { maxScore = sc; primary = s; }
  }
  return { primary, allSpheres, scores };
}

function getDomainSpheres(domain) {
  if (!domain) return null;
  let cached = _domainCache.get(domain);
  if (!cached) {
    cached = _buildDomainCacheEntry(domain);
    _domainCache.set(domain, cached);
  }
  return cached;
}

/**
 * Fast classification: domain-first, then title keywords, then model affinity.
 * Returns { primary: string, allSpheres: string[] }
 */
function classifyPaperFast(paper, modelName) {
  // 1. Try domain (cached, very fast)
  const domainResult = getDomainSpheres(paper.research_domain);
  if (domainResult && domainResult.primary) {
    return domainResult;
  }

  // 2. Try title keywords (only for papers where domain didn't match)
  const title = (paper.title || '').toLowerCase();
  if (title) {
    const scores = {};
    for (const [sphere, def] of Object.entries(SPHERE_DEFINITIONS)) {
      for (const kw of def.domainKeywords) {
        if (title.includes(kw)) {
          scores[sphere] = (scores[sphere] || 0) + 2;
        }
      }
    }
    const allSpheres = Object.keys(scores);
    if (allSpheres.length > 0) {
      let primary = allSpheres[0];
      let maxScore = scores[primary];
      for (const s of allSpheres) {
        if (scores[s] > maxScore) { maxScore = scores[s]; primary = s; }
      }
      return { primary, allSpheres };
    }
  }

  // 3. Model affinity fallback — pick the highest affinity sphere
  let bestSphere = null;
  let bestAffinity = 0;
  for (const [sphere, def] of Object.entries(SPHERE_DEFINITIONS)) {
    const affinity = def.modelAffinity[modelName] || 0;
    if (affinity >= 0.5 && affinity > bestAffinity) {
      bestAffinity = affinity;
      bestSphere = sphere;
    }
  }
  if (bestSphere) {
    return { primary: bestSphere, allSpheres: [bestSphere] };
  }

  return { primary: 'Unclassified', allSpheres: [] };
}

/**
 * Classify all papers from all models into Earth system spheres.
 * Optimized: avoids copying paper objects, uses lightweight tracking.
 */
export function classifyAllPapers(allModelsData) {
  const sphereData = {};

  // Initialize sphere data
  for (const sphere of Object.keys(SPHERE_DEFINITIONS)) {
    sphereData[sphere] = {
      ...SPHERE_DEFINITIONS[sphere],
      papers: [],
      models: {},
      totalCitations: 0,
      domains: new Set(),
      paperCount: 0,
    };
  }
  sphereData['Unclassified'] = {
    color: '#9CA3AF',
    icon: 'HelpCircle',
    description: 'Papers not yet classified into an Earth system sphere',
    papers: [],
    models: {},
    totalCitations: 0,
    domains: new Set(),
    paperCount: 0,
  };

  // Track inter-sphere links with counts only (not full paper refs)
  const interSphereCounts = {}; // "A-B" -> count
  // Keep a small sample of cross-sphere papers for the table (max 200)
  const crossSphereSamples = []; // lightweight refs
  const MAX_CROSS_SAMPLES = 200;

  // Track top papers per sphere (top 50 by citation count)
  const sphereTopPapers = {};
  for (const sphere of Object.keys(SPHERE_DEFINITIONS)) {
    sphereTopPapers[sphere] = [];
  }
  sphereTopPapers['Unclassified'] = [];

  const TOP_N = 50;

  // Classify each paper
  for (const [modelName, papers] of Object.entries(allModelsData)) {
    if (!Array.isArray(papers)) continue;

    for (const paper of papers) {
      const { primary, allSpheres } = classifyPaperFast(paper, modelName);
      const citations = paper.citation_count || paper['is-referenced-by-count'] || 0;

      // Update sphere counts (no object copying)
      const target = sphereData[primary] || sphereData['Unclassified'];
      target.paperCount++;
      target.totalCitations += citations;
      if (!target.models[modelName]) target.models[modelName] = 0;
      target.models[modelName]++;
      if (paper.research_domain) target.domains.add(paper.research_domain);

      // Track top papers per sphere (lightweight — only keep top N)
      const topList = sphereTopPapers[primary] || sphereTopPapers['Unclassified'];
      if (topList.length < TOP_N || citations > (topList[topList.length - 1]?.citation_count || 0)) {
        topList.push({
          title: paper.title,
          year: paper.year,
          citation_count: citations,
          modelName,
          doi: paper.doi,
        });
        if (topList.length > TOP_N) {
          topList.sort((a, b) => b.citation_count - a.citation_count);
          topList.length = TOP_N;
        }
      }

      // Inter-sphere connections
      if (allSpheres.length > 1) {
        for (let i = 0; i < allSpheres.length; i++) {
          for (let j = i + 1; j < allSpheres.length; j++) {
            const key = [allSpheres[i], allSpheres[j]].sort().join('-');
            interSphereCounts[key] = (interSphereCounts[key] || 0) + 1;
          }
        }

        // Keep a sample for the cross-sphere papers table
        if (crossSphereSamples.length < MAX_CROSS_SAMPLES) {
          crossSphereSamples.push({
            title: paper.title,
            year: paper.year,
            citations,
            spheres: allSpheres,
            models: [modelName],
            doi: paper.doi,
          });
        }
      }
    }
  }

  // Assign top papers to sphere data
  for (const [sphere, data] of Object.entries(sphereData)) {
    data.papers = sphereTopPapers[sphere] || [];
    data.domains = Array.from(data.domains);
  }

  // Build inter-sphere links
  const interSphereLinks = Object.entries(interSphereCounts)
    .map(([key, count]) => {
      const spheres = key.split('-');
      return { spheres, count, papers: [] };
    })
    .sort((a, b) => b.count - a.count);

  // Attach cross-sphere paper samples to links
  for (const sample of crossSphereSamples) {
    for (let i = 0; i < sample.spheres.length; i++) {
      for (let j = i + 1; j < sample.spheres.length; j++) {
        const key = [sample.spheres[i], sample.spheres[j]].sort().join('-');
        const link = interSphereLinks.find(l => l.spheres.join('-') === key);
        if (link && link.papers.length < 30) {
          link.papers.push({
            paper: sample,
            spheres: new Set(sample.spheres),
            models: new Set(sample.models),
            citations: sample.citations,
          });
        }
      }
    }
  }

  // Build model-to-sphere connections for bipartite graph
  const modelSphereConnections = [];
  for (const [sphere, data] of Object.entries(sphereData)) {
    for (const [model, count] of Object.entries(data.models)) {
      modelSphereConnections.push({ model, sphere, count });
    }
  }

  return {
    sphereData,
    interSphereLinks,
    modelSphereConnections,
    definitions: SPHERE_DEFINITIONS,
  };
}

export { SPHERE_DEFINITIONS };

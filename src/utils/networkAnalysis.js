// Network Analysis Utility for Multi-Model Citation Analysis
// Analyzes connections between different scientific models through shared citations

import { getModelList } from '../config/modelConfig';

/**
 * Load all model data files
 * @returns {Promise<Object>} Object with model names as keys and data arrays as values
 */
export const loadAllModelData = async () => {
  const models = getModelList();
  const { loadAllModelsData } = await import('./dataLoader');

  try {
    const modelData = await loadAllModelsData(models);
    for (const modelName of models) {
      console.log(`Loaded ${(modelData[modelName] || []).length} papers for ${modelName}`);
    }
    return modelData;
  } catch (error) {
    console.error('Error loading model data:', error);
    // Return empty arrays as fallback
    const modelData = {};
    for (const modelName of models) {
      modelData[modelName] = [];
    }
    return modelData;
  }
};

/**
 * Extract DOI from a paper entry (handles different data formats)
 * @param {Object} paper - Paper entry
 * @returns {string|null} Normalized DOI
 */
const extractDOI = (paper) => {
  if (!paper) return null;

  // Check common DOI fields
  const doi = paper.DOI || paper.doi || paper.team_paper_doi;

  if (!doi) return null;

  // Normalize DOI (lowercase, trim)
  return String(doi).toLowerCase().trim();
};

/**
 * Extract title from a paper entry (handles array or string)
 * @param {Object} paper - Paper entry
 * @returns {string} Paper title
 */
const extractTitle = (paper) => {
  if (!paper) return 'Unknown Title';

  const title = paper.title;

  if (Array.isArray(title)) {
    return title[0] || 'Unknown Title';
  }

  return title || 'Unknown Title';
};

/**
 * Extract authors from a paper entry
 * @param {Object} paper - Paper entry
 * @returns {Array<string>} List of author names
 */
const extractAuthors = (paper) => {
  if (!paper) return [];

  // Check if authors is already an array of strings
  if (Array.isArray(paper.authors) && typeof paper.authors[0] === 'string') {
    return paper.authors;
  }

  // Check if it's Crossref format with author objects
  if (Array.isArray(paper.author)) {
    return paper.author.map(a => {
      if (typeof a === 'string') return a;
      return `${a.given || ''} ${a.family || ''}`.trim();
    }).filter(name => name);
  }

  return [];
};

/**
 * Find bridge papers - papers that appear in multiple model datasets
 * @param {Object} modelData - Object with model names and their data
 * @returns {Array} Array of bridge papers with metadata
 */
export const findBridgePapers = (modelData) => {
  const doiMap = new Map(); // DOI -> { paper, models: Set }

  // Build DOI map
  Object.entries(modelData).forEach(([modelName, papers]) => {
    papers.forEach(paper => {
      const doi = extractDOI(paper);
      if (!doi) return;

      if (!doiMap.has(doi)) {
        doiMap.set(doi, {
          doi,
          paper,
          models: new Set(),
          title: extractTitle(paper),
          authors: extractAuthors(paper),
          year: paper.year || (paper['published-print']?.['date-parts']?.[0]?.[0]),
          citationCount: paper['is-referenced-by-count'] || paper.citation_count || 0,
          venue: paper.venue || (Array.isArray(paper['container-title']) ? paper['container-title'][0] : paper['container-title']) || 'Unknown',
          researchDomain: paper.research_domain || 'Unknown'
        });
      }

      doiMap.get(doi).models.add(modelName);
    });
  });

  // Filter to only bridge papers (appearing in 2+ models)
  const bridgePapers = Array.from(doiMap.values())
    .filter(item => item.models.size > 1)
    .map(item => ({
      ...item,
      models: Array.from(item.models),
      modelCount: item.models.size
    }))
    .sort((a, b) => b.modelCount - a.modelCount || b.citationCount - a.citationCount);

  console.log(`Found ${bridgePapers.length} bridge papers across models`);

  return bridgePapers;
};

/**
 * Calculate connection matrix between all models
 * @param {Object} modelData - Object with model names and their data
 * @param {Array} bridgePapers - Array of bridge papers
 * @returns {Object} Connection matrix and statistics
 */
export const calculateConnectionMatrix = (modelData, bridgePapers) => {
  const models = Object.keys(modelData);
  const matrix = {};
  const connections = [];

  // Initialize matrix
  models.forEach(model1 => {
    matrix[model1] = {};
    models.forEach(model2 => {
      matrix[model1][model2] = {
        count: 0,
        papers: []
      };
    });
  });

  // Count connections
  bridgePapers.forEach(paper => {
    const paperModels = paper.models;

    // For each pair of models this paper connects
    for (let i = 0; i < paperModels.length; i++) {
      for (let j = i + 1; j < paperModels.length; j++) {
        const model1 = paperModels[i];
        const model2 = paperModels[j];

        // Add to both directions
        matrix[model1][model2].count++;
        matrix[model1][model2].papers.push(paper);

        matrix[model2][model1].count++;
        matrix[model2][model1].papers.push(paper);
      }
    }
  });

  // Create list of connections for easier processing
  models.forEach(model1 => {
    models.forEach(model2 => {
      if (model1 < model2) { // Avoid duplicates
        const count = matrix[model1][model2].count;
        if (count > 0) {
          connections.push({
            source: model1,
            target: model2,
            strength: count,
            papers: matrix[model1][model2].papers
          });
        }
      }
    });
  });

  // Sort connections by strength
  connections.sort((a, b) => b.strength - a.strength);

  return {
    matrix,
    connections,
    models
  };
};

/**
 * Analyze cross-model authors
 * @param {Array} bridgePapers - Array of bridge papers
 * @returns {Array} Authors who appear in multiple models
 */
export const analyzeCrossModelAuthors = (bridgePapers) => {
  const authorMap = new Map(); // Author -> { models: Set, papers: [] }

  bridgePapers.forEach(paper => {
    paper.authors.forEach(author => {
      if (!author) return;

      const normalizedAuthor = author.trim();
      if (!authorMap.has(normalizedAuthor)) {
        authorMap.set(normalizedAuthor, {
          name: normalizedAuthor,
          models: new Set(),
          papers: []
        });
      }

      const authorData = authorMap.get(normalizedAuthor);
      paper.models.forEach(model => authorData.models.add(model));
      authorData.papers.push(paper);
    });
  });

  // Filter to authors with 2+ models and convert to array
  const crossModelAuthors = Array.from(authorMap.values())
    .filter(author => author.models.size > 1)
    .map(author => ({
      ...author,
      models: Array.from(author.models),
      modelCount: author.models.size,
      paperCount: author.papers.length
    }))
    .sort((a, b) => b.modelCount - a.modelCount || b.paperCount - a.paperCount);

  return crossModelAuthors.slice(0, 50); // Top 50
};

/**
 * Analyze research domain overlap
 * @param {Array} bridgePapers - Array of bridge papers
 * @returns {Array} Domains spanning multiple models
 */
export const analyzeDomainOverlap = (bridgePapers) => {
  const domainMap = new Map(); // Domain -> { models: Set, papers: [] }

  bridgePapers.forEach(paper => {
    const domain = paper.researchDomain;
    if (!domain || domain === 'Unknown') return;

    if (!domainMap.has(domain)) {
      domainMap.set(domain, {
        domain,
        models: new Set(),
        papers: []
      });
    }

    const domainData = domainMap.get(domain);
    paper.models.forEach(model => domainData.models.add(model));
    domainData.papers.push(paper);
  });

  // Convert to array and add stats
  const domainOverlap = Array.from(domainMap.values())
    .map(domain => ({
      ...domain,
      models: Array.from(domain.models),
      modelCount: domain.models.size,
      paperCount: domain.papers.length
    }))
    .sort((a, b) => b.modelCount - a.modelCount || b.paperCount - a.paperCount);

  return domainOverlap;
};

/**
 * Calculate network metrics for models
 * @param {Object} connectionData - Connection matrix data
 * @param {Object} modelData - Raw model data
 * @returns {Object} Network metrics for each model
 */
export const calculateNetworkMetrics = (connectionData, modelData) => {
  const { matrix, models } = connectionData;
  const metrics = {};

  models.forEach(model => {
    // Total connections (degree)
    const totalConnections = models.reduce((sum, otherModel) => {
      if (model !== otherModel) {
        return sum + matrix[model][otherModel].count;
      }
      return sum;
    }, 0);

    // Number of connected models
    const connectedModels = models.filter(otherModel =>
      model !== otherModel && matrix[model][otherModel].count > 0
    );

    // Average connection strength
    const avgStrength = connectedModels.length > 0
      ? totalConnections / connectedModels.length
      : 0;

    // Total papers in this model
    const totalPapers = modelData[model]?.length || 0;

    metrics[model] = {
      name: model,
      totalConnections,
      connectedModelsCount: connectedModels.length,
      connectedModels,
      avgConnectionStrength: Math.round(avgStrength * 10) / 10,
      totalPapers,
      connectivityRatio: totalPapers > 0 ? (totalConnections / totalPapers) : 0
    };
  });

  // Rank by centrality (total connections)
  const rankedModels = Object.values(metrics)
    .sort((a, b) => b.totalConnections - a.totalConnections);

  return {
    metrics,
    rankedModels
  };
};

/**
 * Perform complete network analysis
 * @returns {Promise<Object>} Complete network analysis results
 */
export const performNetworkAnalysis = async () => {
  console.log('Starting network analysis...');

  // Load all model data
  const modelData = await loadAllModelData();

  // Find bridge papers
  const bridgePapers = findBridgePapers(modelData);

  // Calculate connections
  const connectionData = calculateConnectionMatrix(modelData, bridgePapers);

  // Analyze authors
  const crossModelAuthors = analyzeCrossModelAuthors(bridgePapers);

  // Analyze domains
  const domainOverlap = analyzeDomainOverlap(bridgePapers);

  // Calculate metrics
  const networkMetrics = calculateNetworkMetrics(connectionData, modelData);

  // Calculate summary statistics
  const totalModels = Object.keys(modelData).length;
  const totalPapers = Object.values(modelData).reduce((sum, papers) => sum + papers.length, 0);
  const totalBridgePapers = bridgePapers.length;
  const totalConnections = connectionData.connections.reduce((sum, conn) => sum + conn.strength, 0);

  const mostConnectedModel = networkMetrics.rankedModels[0];
  const strongestConnection = connectionData.connections[0];
  const topBridgePaper = bridgePapers[0];

  console.log('Network analysis complete!');
  console.log(`- Total models: ${totalModels}`);
  console.log(`- Total papers: ${totalPapers}`);
  console.log(`- Bridge papers: ${totalBridgePapers}`);
  console.log(`- Total connections: ${totalConnections}`);

  return {
    modelData,
    bridgePapers,
    connectionData,
    crossModelAuthors,
    domainOverlap,
    networkMetrics,
    summary: {
      totalModels,
      totalPapers,
      totalBridgePapers,
      totalConnections,
      bridgePaperPercentage: ((totalBridgePapers / totalPapers) * 100).toFixed(2),
      mostConnectedModel,
      strongestConnection,
      topBridgePaper
    }
  };
};

// src/utils/dataLoader.js
// Utility for loading model citation data from public/data/ at runtime
// instead of bundling JSON files into the JavaScript bundle.

const dataCache = new Map();

/**
 * Get the base path for data files.
 * In production (GitHub Pages): /science-model-dashboard/data/
 * In development: /data/
 */
function getBasePath() {
  return process.env.PUBLIC_URL + '/data/';
}

/**
 * Load citation data for a single model.
 * Returns cached data if already loaded.
 * @param {string} modelName - e.g. 'RAPID', 'ECCO', 'CMS-Flux'
 * @returns {Promise<Array>} The citation data array
 */
export async function loadModelData(modelName) {
  if (dataCache.has(modelName)) {
    return dataCache.get(modelName);
  }

  const url = `${getBasePath()}${modelName}_analyzed.json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load data for ${modelName}: ${response.status}`);
  }
  const data = await response.json();
  dataCache.set(modelName, data);
  return data;
}

/**
 * Load citation data for multiple models in parallel.
 * @param {string[]} modelNames - Array of model names
 * @returns {Promise<Object>} Map of modelName -> data array
 */
export async function loadAllModelsData(modelNames) {
  const results = await Promise.all(
    modelNames.map(async (name) => {
      const data = await loadModelData(name);
      return [name, data];
    })
  );
  return Object.fromEntries(results);
}

/**
 * Clear cached data for a model or all models.
 * @param {string} [modelName] - If provided, clear only this model's cache
 */
export function clearCache(modelName) {
  if (modelName) {
    dataCache.delete(modelName);
  } else {
    dataCache.clear();
  }
}

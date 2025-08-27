// Model configuration for all supported models
export const MODELS = {
  RAPID: {
    name: 'RAPID',
    displayName: 'RAPID',
    description: 'Routing Application for Parallel computatIon of Discharge',
    dataPath: '../../data/RAPID_analyzed.json',
    color: '#3B82F6', // Blue
    domain: 'Hydrology',
    github: 'https://github.com/c-h-david/rapid',
    website: 'http://rapid-hub.org/',
    fullDescription: 'RAPID is a river network routing model that can compute flow and volume of water everywhere in river networks made out of many thousands of reaches, given surface and groundwater inflow to rivers.'
  },
  CARDAMOM: {
    name: 'CARDAMOM',
    displayName: 'CARDAMOM',
    description: 'Carbon Data Model Framework',
    dataPath: '../../data/CARDAMOM_analyzed.json',
    color: '#10B981', // Green
    domain: 'Ecology/Carbon Cycle',
    github: 'https://github.com/GCEL/CARDAMOM',
    website: 'https://cardamom-framework.github.io/CARDAMOM',
    fullDescription: 'CARDAMOM is a Bayesian framework that retrieves ensembles of parameters for models of the terrestrial carbon cycle that are consistent with observational constraints and their associated uncertainties.'
  },
  'CMS-Flux': {
    name: 'CMS-Flux',
    displayName: 'CMS-Flux',
    description: 'Carbon Monitoring System Flux',
    dataPath: '../../data/CMS-Flux_analyzed.json',
    color: '#F59E0B', // Amber
    domain: 'Carbon Flux Monitoring',
    github: 'https://github.com/ornldaac/cms',
    website: 'https://cmsflux.jpl.nasa.gov/',
    fullDescription: 'NASA Carbon Monitoring System Flux (CMS-Flux) is a global carbon cycle data assimilation system that quantifies the spatial and process drivers of atmospheric CO2.'
  },
  ECCO: {
    name: 'ECCO',
    displayName: 'ECCO',
    description: 'Estimating the Circulation and Climate of the Ocean',
    dataPath: '../../data/ECCO_analyzed.json',
    color: '#8B5CF6', // Purple
    domain: 'Oceanography',
    github: 'https://github.com/ECCO-GROUP',
    website: 'https://ecco-group.org/',
    fullDescription: 'ECCO version 4 is an ocean state estimation framework based on the MITgcm and its adjoint, providing a physically consistent description of the time-evolving state of the ocean.'
  },
  ISSM: {
    name: 'ISSM',
    displayName: 'ISSM',
    description: 'Ice Sheet System Model',
    dataPath: '../../data/ISSM_analyzed.json',
    color: '#06B6D4', // Cyan
    domain: 'Glaciology',
    github: 'https://github.com/ISSMteam/ISSM',
    website: 'https://issm.jpl.nasa.gov/',
    fullDescription: 'The Ice-sheet and Sea-level System Model (ISSM) tackles the challenge of modeling the evolution of the polar ice caps in Greenland and Antarctica, and the resulting solid-Earth and sea-level response.'
  },
  'MOMO-CHEM': {
    name: 'MOMO-CHEM',
    displayName: 'MOMO-CHEM',
    description: 'Multi-mOdel Multi-cOnstituent Chemical data assimilation',
    dataPath: '../../data/MOMO-CHEM_analyzed.json',
    color: '#EF4444', // Red
    domain: 'Atmospheric Chemistry',
    github: null, // No dedicated GitHub repository found
    website: 'https://acp.copernicus.org/articles/20/931/2020/',
    fullDescription: 'MOMO-CHEM is a multi-model, multi-constituent chemical data assimilation framework for tropospheric chemical reanalysis that directly accounts for model error in transport and chemistry.'
  }
};

export const MODEL_ROUTES = {
  RAPID: '/science-model-dashboard/RAPID',
  CARDAMOM: '/science-model-dashboard/CARDAMOM',
  'CMS-Flux': '/science-model-dashboard/CMS-Flux',
  ECCO: '/science-model-dashboard/ECCO',
  ISSM: '/science-model-dashboard/ISSM',
  'MOMO-CHEM': '/science-model-dashboard/MOMO-CHEM'
};

export const getModelList = () => Object.keys(MODELS);

export const getModelConfig = (modelName) => MODELS[modelName];

export const getModelRoute = (modelName) => MODEL_ROUTES[modelName];
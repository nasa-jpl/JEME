// src/data/modelData.js
// Model comparison data with updated citation counts from research
import colors from '../utils/colors';

const modelData = [
  {
    name: 'RAPID',
    citations: 265,
    year: 2011,
    color: '#3B82F6',
    description: 'Routing Application for Parallel computation of Discharge',
    domain: 'Hydrology'
  },
  {
    name: 'CARDAMOM',
    citations: 1108,
    year: 2015,
    color: '#10B981',
    description: 'Carbon Data Model Framework',
    domain: 'Ecology/Carbon Cycle'
  },
  {
    name: 'CMS-Flux',
    citations: 2154,
    year: 2010,
    color: '#F59E0B',
    description: 'Carbon Monitoring System Flux',
    domain: 'Carbon Flux Monitoring'
  },
  {
    name: 'ECCO',
    citations: 21798,
    year: 2008,
    color: '#8B5CF6',
    description: 'Estimating the Circulation and Climate of the Ocean',
    domain: 'Oceanography'
  },
  {
    name: 'ISSM',
    citations: 5431,
    year: 2009,
    color: '#06B6D4',
    description: 'Ice Sheet System Model',
    domain: 'Glaciology'
  },
  {
    name: 'MOMO-CHEM',
    citations: 521,
    year: 2018,
    color: '#EF4444',
    description: 'Multi-mOdel Multi-cOnstituent Chemical data assimilation',
    domain: 'Atmospheric Chemistry'
  },
  {
    name: 'LES',
    citations: 276,
    year: 2020,
    color: '#2E8B57',
    description: 'Large Eddy Simulation for Atmospheric Studies',
    domain: 'Atmospheric Modeling'
  },
  {
    name: 'EDMF',
    citations: 1556,
    year: 2018,
    color: '#FF6347',
    description: 'Eddy Diffusivity Mass Flux Scheme',
    domain: 'Atmospheric Modeling'
  }
];

export default modelData;
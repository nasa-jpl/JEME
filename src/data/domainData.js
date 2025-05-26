// src/data/domainData.js
// Research domains data based on analysis of rapid_20250523.json

import colors from '../utils/colors';

const domainData = [
  { name: 'Flood Prediction', value: 66, percentage: 24.9, color: colors.primary },
  { name: 'River Modeling', value: 59, percentage: 22.3, color: colors.secondary },
  { name: 'Hydrologic Modeling', value: 38, percentage: 14.3, color: colors.tertiary },
  { name: 'Other Specialties', value: 35, percentage: 13.2, color: colors.accent },
  { name: 'Water Resources', value: 27, percentage: 10.2, color: colors.warning },
  { name: 'Streamflow Analysis', value: 22, percentage: 8.3, color: colors.success },
  { name: 'Flow Analysis', value: 14, percentage: 5.3, color: colors.info }
];

// Detailed breakdown of domain categories
export const domainBreakdown = {
  'Flood Prediction': {
    total: 66,
    subdomains: [
      { name: 'Flood Prediction', count: 48 },
      { name: 'Flash Flood Prediction', count: 3 },
      { name: 'Flood Modeling', count: 2 },
      { name: 'Coastal-Riverine Flood Modeling', count: 1 },
      { name: 'Flood Prediction / River Modeling', count: 1 },
      { name: 'Flood Prediction / Urban Hydrology', count: 1 },
      { name: 'Flood Prediction/Inundation Mapping', count: 1 },
      { name: 'Flood Prediction/Mapping', count: 1 },
      { name: 'Flood Prediction/Rainfall Thresholds', count: 1 },
      { name: 'Others', count: 7 }
    ],
    description: 'Research focused on predicting, modeling, and mapping flood events across various scales and environments'
  },

  'River Modeling': {
    total: 59,
    subdomains: [
      { name: 'River Modeling', count: 34 },
      { name: 'Watershed Modeling', count: 3 },
      { name: 'Global River Modeling', count: 1 },
      { name: 'River Network Dynamics/Geomorphology', count: 1 },
      { name: 'River Ecology/River Management', count: 1 },
      { name: 'River Routing/Streamflow Modeling', count: 1 },
      { name: 'River Routing/Hydrology', count: 1 },
      { name: 'Others', count: 17 }
    ],
    description: 'Comprehensive modeling of river systems, networks, and watershed processes'
  },

  'Hydrologic Modeling': {
    total: 38,
    subdomains: [
      { name: 'Hydrologic Modeling', count: 16 },
      { name: 'Hydrologic Forecasting', count: 2 },
      { name: 'Global Hydrological Modeling', count: 2 },
      { name: 'Hydrology', count: 2 },
      { name: 'Integrated Hydrological Modeling', count: 1 },
      { name: 'Large-Scale Hydrologic Simulation', count: 1 },
      { name: 'Others', count: 14 }
    ],
    description: 'Development and application of hydrological models across various scales and applications'
  },

  'Water Resources': {
    total: 27,
    subdomains: [
      { name: 'Water Resources', count: 13 },
      { name: 'Water Resources/Hydrological Modeling', count: 1 },
      { name: 'Water Resources/Hydrologic Modeling', count: 1 },
      { name: 'Water Balance/Water Resources', count: 1 },
      { name: 'Hydropower/Water Resources', count: 1 },
      { name: 'Water Resources Estimation', count: 1 },
      { name: 'Others', count: 9 }
    ],
    description: 'Management, assessment, and sustainable use of water resources'
  },

  'Streamflow Analysis': {
    total: 22,
    subdomains: [
      { name: 'Streamflow', count: 18 },
      { name: 'Streamflow Forecasting', count: 2 },
      { name: 'Streamflow Estimation', count: 1 },
      { name: 'Streamflow/River Modeling', count: 1 }
    ],
    description: 'Analysis, prediction, and estimation of streamflow patterns and characteristics'
  },

  'Flow Analysis': {
    total: 14,
    subdomains: [
      { name: 'Flow Analysis', count: 13 },
      { name: 'Flow Analysis/Networked Systems', count: 1 }
    ],
    description: 'Detailed analysis of flow dynamics, routing, and hydraulic processes'
  },

  'Other Specialties': {
    total: 35,
    majorSubdomains: [
      { name: 'Remote Sensing Applications', count: 8 },
      { name: 'Climate & Environmental', count: 7 },
      { name: 'Coastal & Marine', count: 6 },
      { name: 'Energy & Hydropower', count: 5 },
      { name: 'Decision Support Systems', count: 4 },
      { name: 'Technical Infrastructure', count: 5 }
    ],
    description: 'Specialized applications including remote sensing, climate impacts, coastal processes, energy applications, and decision support systems'
  }
};

// Research impact and trends
export const domainInsights = {
  totalClassifiedRecords: 261,
  totalRecords: 265,
  
  keyTrends: [
    "Flood Prediction dominates with 24.9% of research, reflecting societal importance",
    "River Modeling (22.3%) shows strong fundamental research base",
    "Hydrologic Modeling (14.3%) indicates robust methodological development",
    "Diverse specialties (13.2%) demonstrate interdisciplinary applications",
    "Water Resources (10.2%) focuses on practical management applications"
  ],

  temporalEvolution: {
    early: "2011-2015: Focus on basic river routing and flow modeling",
    growth: "2016-2019: Expansion into flood prediction and real-time applications", 
    maturity: "2020-2025: Diversification into climate impacts, remote sensing, and specialized applications"
  },

  geographicFocus: {
    global: "Many studies focus on global-scale applications and methods",
    regional: "Strong representation of US watersheds (Mississippi, Columbia, etc.)",
    emerging: "Growing focus on developing regions and ungauged basins"
  },

  methodologicalApproaches: {
    'Level 1: Simple Citation': 48, // Basic reference to RAPID
    'Level 2: Data Usage': 79,      // Using RAPID outputs
    'Level 3: Model Adaptation': 106, // Modifying/coupling RAPID
    'Level 4: Foundational Method': 27 // Building on RAPID principles
  },

  impactMetrics: {
    highImpactDomains: [
      "Flood Prediction: 1,579 citations (single paper)",
      "River Modeling: Strong in peer-reviewed journals",
      "Hydrologic Modeling: Foundation for many applications"
    ],
    emergingAreas: [
      "Remote Sensing Integration",
      "Climate Change Applications", 
      "Real-time Forecasting Systems",
      "Multi-scale Modeling"
    ]
  }
};

export default domainData;
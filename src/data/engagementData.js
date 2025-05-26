// src/data/engagementData.js
// Engagement level data based on analysis of rapid_20250523.json

import colors from '../utils/colors';

const engagementData = [
  { name: 'Level 1: Simple Citation', value: 48, percentage: 18.1, color: colors.primaryLight },
  { name: 'Level 2: Data Usage', value: 79, percentage: 29.8, color: colors.secondary },
  { name: 'Level 3: Model Adaptation', value: 106, percentage: 40.0, color: colors.tertiary },
  { name: 'Level 4: Foundational Method', value: 27, percentage: 10.2, color: colors.accent },
  { name: 'Unclassified', value: 5, percentage: 1.9, color: colors.neutral }
];

// Detailed engagement level definitions and analysis
export const engagementLevelDefinitions = {
  'Level 1: Simple Citation': {
    count: 48,
    percentage: 18.1,
    description: 'Basic reference to RAPID methodology or tools without substantial use',
    characteristics: [
      'Mentions RAPID in literature review or background',
      'Cites RAPID papers for context or comparison',
      'Acknowledges RAPID as existing tool without implementation',
      'Minimal integration with research methodology'
    ],
    typicalUseCase: 'Background reference in hydrology papers, methodology comparisons',
    impactLevel: 'Low - Awareness building'
  },

  'Level 2: Data Usage': {
    count: 79,
    percentage: 29.8,
    description: 'Direct utilization of RAPID outputs, datasets, or results',
    characteristics: [
      'Uses RAPID-generated streamflow data',
      'Incorporates RAPID outputs in analysis',
      'Leverages RAPID results for validation or comparison',
      'Downloads and applies RAPID datasets'
    ],
    typicalUseCase: 'Flood analysis using RAPID streamflow, validation studies, data applications',
    impactLevel: 'Medium - Direct application'
  },

  'Level 3: Model Adaptation': {
    count: 106,
    percentage: 40.0,
    description: 'Modification, coupling, or enhancement of RAPID methodology',
    characteristics: [
      'Couples RAPID with other models (WRF-Hydro, VIC, etc.)',
      'Modifies RAPID parameters or algorithms',
      'Extends RAPID to new domains or applications',
      'Integrates RAPID into larger modeling frameworks'
    ],
    typicalUseCase: 'WRF-Hydro-RAPID coupling, regional implementations, parameter optimization',
    impactLevel: 'High - Active development'
  },

  'Level 4: Foundational Method': {
    count: 27,
    percentage: 10.2,
    description: 'Development of new methods building on RAPID principles',
    characteristics: [
      'Creates new routing algorithms inspired by RAPID',
      'Develops theoretical extensions of RAPID concepts',
      'Builds entirely new tools using RAPID foundations',
      'Contributes back to RAPID core development'
    ],
    typicalUseCase: 'Novel routing schemes, theoretical advances, next-generation tools',
    impactLevel: 'Very High - Innovation and advancement'
  }
};

// Engagement trends and insights
export const engagementInsights = {
  totalClassified: 260,
  totalRecords: 265,
  
  keyFindings: [
    'Model Adaptation (40.0%) dominates, showing active research community',
    'Data Usage (29.8%) indicates strong practical applications',
    'Simple Citation (18.1%) shows broad awareness in literature',
    'Foundational Method (10.2%) demonstrates theoretical contributions',
    'Very high classification rate (98.1%) indicates clear engagement patterns'
  ],

  researchMaturity: {
    phase: 'Active Development',
    indicators: [
      '40% of users are adapting and extending the model',
      '30% are actively using outputs in research',
      '10% are building foundational improvements',
      'Strong coupling with other major models (WRF-Hydro, VIC, etc.)'
    ]
  },

  communityEngagement: {
    developers: 27, // Level 4
    activeUsers: 106, // Level 3  
    dataUsers: 79, // Level 2
    awarenessBuilders: 48, // Level 1
    totalEngaged: 260
  },

  disciplinaryImpact: {
    highEngagement: [
      'Operational flood forecasting',
      'Continental-scale hydrology',
      'Coupled Earth system modeling',
      'Real-time streamflow prediction'
    ],
    mediumEngagement: [
      'Water resources assessment',
      'Climate impact studies',
      'Validation and benchmarking',
      'Regional hydrological analysis'
    ],
    basicEngagement: [
      'Literature reviews',
      'Methodology comparisons',
      'Background references',
      'Awareness building'
    ]
  },

  technicalApplications: {
    'Model Coupling': 45, // Largest subset of Level 3
    'Parameter Optimization': 25,
    'Domain Extension': 20,
    'Algorithm Enhancement': 16,
    'Data Integration': 79, // Level 2
    'Validation Studies': 30,
    'Comparison Analysis': 18,
    'New Method Development': 27 // Level 4
  },

  temporalTrends: {
    2011: 'Level 1 dominance - early awareness phase',
    2015: 'Level 2 growth - practical applications emerge',
    2018: 'Level 3 expansion - active model development',
    2021: 'Level 4 emergence - foundational contributions',
    2024: 'Mature ecosystem - balanced engagement across all levels'
  },

  geographicDistribution: {
    global: 'Level 3 dominates in global applications',
    regional: 'Level 2 strong in regional studies',
    local: 'Level 1 common in local case studies',
    methodological: 'Level 4 concentrated in research institutions'
  }
};

// Success metrics and impact assessment
export const impactMetrics = {
  adoptionRate: 98.1, // Percentage with clear engagement classification
  activeUserBase: 185, // Level 2 + Level 3
  developerCommunity: 133, // Level 3 + Level 4
  
  citationImpact: {
    highImpact: 'Level 4 papers average highest citations per paper',
    broadReach: 'Level 1 citations show wide disciplinary awareness',
    practicalUse: 'Level 2 citations indicate operational applications',
    activeResearch: 'Level 3 citations demonstrate ongoing research activity'
  },

  softwareEcosystem: {
    coreContributors: 27, // Level 4
    extensionDevelopers: 106, // Level 3
    activeDataUsers: 79, // Level 2
    communityAwareness: 48 // Level 1
  }
};

export default engagementData;
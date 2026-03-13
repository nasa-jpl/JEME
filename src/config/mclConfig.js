// Model Capability Level (MCL) configuration
// Based on JPL's Multi-Dimensional Earth System Model Assessment framework

// Tier 1: 14 core model capability dimensions
export const TIER1_DIMENSIONS = [
  {
    id: 'process_representation',
    label: 'Process Representation',
    shortLabel: 'Process Rep.',
    description: 'Accuracy and completeness of modeled physical processes',
    levels: [
      'Highly simplified processes, basic parameterizations',
      'Low complexity physics, limited process interactions',
      'Moderate complexity with validated parameterizations',
      'State-of-the-art physics with comprehensive process representation'
    ]
  },
  {
    id: 'spatial_resolution',
    label: 'Spatial Resolution',
    shortLabel: 'Spatial Res.',
    description: 'Ability to resolve relevant spatial scales',
    levels: [
      'Single set of scales (coarse-resolution only)',
      'Broader set of spatial scales represented',
      'Nearly full set of spatial scales covered',
      'All relevant scales fully resolved for intended applications'
    ]
  },
  {
    id: 'temporal_resolution',
    label: 'Temporal Resolution',
    shortLabel: 'Temporal Res.',
    description: 'Frequency of outputs relevant to prediction and policy',
    levels: [
      'Single set of limited time scales only',
      'Broader set of time scales represented',
      'Nearly full set of time scales covered',
      'Full spectrum of time scales for intended applications'
    ]
  },
  {
    id: 'process_coupling',
    label: 'Process Coupling',
    shortLabel: 'Coupling',
    description: 'Process coupling complexity and fidelity',
    levels: [
      'Uncoupled, single-component model',
      'Off-line coupling to one other model/component',
      'Off-line coupling to multiple models OR full coupling between 2 components',
      'Fully coupled Earth System Model with validated interactions'
    ]
  },
  {
    id: 'predictive_skill',
    label: 'Predictive Skill',
    shortLabel: 'Pred. Skill',
    description: 'Ability to simulate and predict observed variability',
    levels: [
      'Not used for prediction purposes',
      'Limited use in prediction applications',
      'Routine use for prediction in limited settings',
      'Demonstrated skill in comprehensive long-term assessments'
    ]
  },
  {
    id: 'computational_performance',
    label: 'Computational Performance',
    shortLabel: 'Comp. Perf.',
    description: 'Scalability on HPC, cloud, or exascale architectures',
    levels: [
      'Not scalable, limited to small systems',
      'Scalable within one architecture (e.g., HPC only)',
      'Scalable across multiple architectures (HPC + GPU)',
      'Exascale-ready with full portability'
    ]
  },
  {
    id: 'observational_constraint',
    label: 'Observational Constraint',
    shortLabel: 'Obs. Constr.',
    description: 'Degree of direct observational constraint on model state',
    levels: [
      'No observational constraints',
      'Limited set of observations assimilated',
      'Comprehensive observational dataset (e.g., NASA missions)',
      'Multi-source observational constraint (satellite + in-situ + airborne)'
    ]
  },
  {
    id: 'retrospective_analysis',
    label: 'Retrospective Analysis',
    shortLabel: 'Retro. Anal.',
    description: 'Use of data assimilation for long-term record generation',
    levels: [
      'No retrospective analysis capability',
      'DA used for bias correction or limited temporal records',
      'Multi-observation DA over long records for limited systems',
      'Coupled, fully integrated, benchmarked reanalysis products'
    ]
  },
  {
    id: 'uq_attribution',
    label: 'UQ & Attribution',
    shortLabel: 'UQ & Attr.',
    description: 'Capability to assess uncertainty propagation and sensitivity',
    levels: [
      'No uncertainty quantification',
      'UQ limited to subset of initial conditions or parameters',
      'Experimental design for IC, parameters, and forcing for limited cases',
      'Fully quantified with probabilistic analysis framework'
    ]
  },
  {
    id: 'vv_framework',
    label: 'V&V Framework',
    shortLabel: 'V&V',
    description: 'Robustness of model evaluation methods',
    levels: [
      'Minimal validation efforts',
      'Validated against limited datasets or case studies',
      'Routine validation against multiple datasets for limited cases',
      'Rigorously validated with systematic benchmarking'
    ]
  },
  {
    id: 'ml_ai_integration',
    label: 'ML/AI Integration',
    shortLabel: 'ML/AI',
    description: 'Use of ML/AI for process emulation, bias correction, data fusion',
    levels: [
      'No ML/AI integration',
      'ML tested on limited processes or parameterizations',
      'ML extensively tested, transitioning to core activities',
      'Fully integrated into core modeling workflows'
    ]
  },
  {
    id: 'mission_support',
    label: 'Mission Support',
    shortLabel: 'Mission Sup.',
    description: 'Role in satellite mission formulation and observational strategies',
    levels: [
      'No mission support capability',
      'Products used to support mission formulation',
      'Forward models integrated for limited mission sets',
      'Key contributor to OSSEs and comprehensive sensor planning'
    ]
  },
  {
    id: 'interoperability',
    label: 'Interoperability',
    shortLabel: 'Interop.',
    description: 'Community accessibility and compatibility with adjacent tools',
    levels: [
      'Proprietary, core developers only',
      'Available within institution, closed to external users',
      'Available to institution + external partners',
      'Fully open source with standardized interfaces'
    ]
  },
  {
    id: 'stakeholder_adoption',
    label: 'Stakeholder Adoption',
    shortLabel: 'Stakeholder',
    description: 'Use in real-world decision-making processes',
    levels: [
      'Research only, no operational applications',
      'Tested in limited applications',
      'Broadly tested for limited applications',
      'Critical tool for operational decision-makers'
    ]
  }
];

// Tier 2: 5 application domains, each with 4 sub-dimensions
export const TIER2_DOMAINS = [
  {
    id: 'research',
    label: 'Advancing Earth Science',
    shortLabel: 'Research',
    description: 'Physics fidelity, model development maturity, predictive skill',
    subDimensions: [
      { id: 'process_fidelity', label: 'Process Representation Fidelity' },
      { id: 'coupling_fidelity', label: 'Coupling Fidelity' },
      { id: 'community_recognition', label: 'Community Recognition & Impact' },
      { id: 'extreme_events', label: 'Simulation of Extreme Events' }
    ]
  },
  {
    id: 'data_assimilation',
    label: 'Data Assimilation Products',
    shortLabel: 'Data Assim.',
    description: 'Satellite DA, hybrid DA, uncertainty quantification',
    subDimensions: [
      { id: 'obs_coverage', label: 'Observational Data Coverage' },
      { id: 'error_correction', label: 'Systematic Error Correction' },
      { id: 'prediction_impact', label: 'Impact on Prediction Skill' },
      { id: 'operational_use', label: 'Use in Operational Systems' }
    ]
  },
  {
    id: 'vvuq_ml',
    label: 'VVUQ & ML',
    shortLabel: 'VVUQ/ML',
    description: 'ML integration, verification rigor, validation completeness',
    subDimensions: [
      { id: 'verification_level', label: 'Verification Level' },
      { id: 'ml_in_processes', label: 'AI/ML in Model Processes' },
      { id: 'vvuq_ml_emulators', label: 'VVUQ in ML Emulators' },
      { id: 'independent_validation', label: 'Validation vs Independent Obs' }
    ]
  },
  {
    id: 'mission_formulation',
    label: 'Mission Support',
    shortLabel: 'Mission Form.',
    description: 'OSSE frameworks, sensor validation, computational efficiency',
    subDimensions: [
      { id: 'osse_capability', label: 'OSSE Capability' },
      { id: 'da_readiness', label: 'DA Readiness for New Satellites' },
      { id: 'decadal_alignment', label: 'Decadal Survey Alignment' },
      { id: 'community_adoption_mission', label: 'Community Adoption for Missions' }
    ]
  },
  {
    id: 'decision_support',
    label: 'Decision Support',
    shortLabel: 'Decision Sup.',
    description: 'Policy relevance, real-time forecasting, disaster response',
    subDimensions: [
      { id: 'operational_usability', label: 'Operational Usability' },
      { id: 'regulatory_relevance', label: 'Regulatory Relevance' },
      { id: 'uncertainty_communication', label: 'Uncertainty Communication' },
      { id: 'community_training', label: 'Community Awareness & Training' }
    ]
  }
];

// Score color mapping (0-3 scale)
export const SCORE_COLORS = {
  0: { bg: '#F3F4F6', text: '#6B7280', label: 'None' },
  1: { bg: '#FEF3C7', text: '#92400E', label: 'Low' },
  2: { bg: '#DBEAFE', text: '#1E40AF', label: 'Medium' },
  3: { bg: '#D1FAE5', text: '#065F46', label: 'High' },
};

// Get maturity level label from score
export const getMaturityLevel = (score) => {
  if (score === undefined || score === null) return 'N/A';
  if (score < 0.5) return 'None';
  if (score < 1.5) return 'Low';
  if (score < 2.5) return 'Medium';
  return 'High';
};

// Get readiness category from tier averages
export const getReadiness = (tier1Avg) => {
  if (tier1Avg <= 1.0) return { label: 'Early Development', color: '#F59E0B' };
  if (tier1Avg <= 2.0) return { label: 'Intermediate', color: '#3B82F6' };
  return { label: 'Mature', color: '#10B981' };
};

// Get color for a numeric score (continuous 0-3)
export const getScoreColor = (score) => {
  if (score === undefined || score === null) return SCORE_COLORS[0];
  return SCORE_COLORS[Math.round(score)] || SCORE_COLORS[0];
};

// Get dimension config by id
export const getDimensionConfig = (dimId) => {
  return TIER1_DIMENSIONS.find(d => d.id === dimId);
};

// Get domain config by id
export const getDomainConfig = (domainId) => {
  return TIER2_DOMAINS.find(d => d.id === domainId);
};

// Calculate tier 1 average from scores object
export const calculateTier1Average = (tier1Scores) => {
  if (!tier1Scores) return 0;
  const scores = Object.values(tier1Scores).map(d => d.score).filter(s => s !== undefined);
  if (scores.length === 0) return 0;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
};

// Calculate tier 2 domain average
export const calculateTier2DomainAverage = (domainScores) => {
  if (!domainScores) return 0;
  const scores = Object.values(domainScores).map(d => d.score).filter(s => s !== undefined);
  if (scores.length === 0) return 0;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
};

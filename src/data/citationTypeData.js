// src/data/citationTypeData.js
// Citation type data based on rapid_20250523.json analysis

import colors from '../utils/colors';

const citationTypeData = [
  { name: 'Peer-Reviewed Journals', value: 107, percentage: 40.4, color: colors.primary },
  { name: 'Conference Papers', value: 15, percentage: 5.7, color: colors.secondary },
  { name: 'Academic Theses', value: 24, percentage: 9.1, color: colors.tertiary },
  { name: 'Technical Reports', value: 13, percentage: 4.9, color: colors.accent },
  { name: 'Online Resources', value: 101, percentage: 38.1, color: colors.warning },
  { name: 'Popular Press', value: 5, percentage: 1.9, color: colors.success }
];

// Classification methodology and metadata
export const classificationCriteria = {
  peerReviewedJournals: {
    description: "Articles published in academic journals with DOI, peer review process",
    indicators: [
      "Wiley Online Library, Elsevier, Springer publishers",
      "Presence of DOI",
      "Journal keywords in source",
      "Academic publishers (Nature, Science, AGU, etc.)"
    ],
    examples: [
      "Hydrological Processes",
      "Water Resources Research", 
      "Journal of Hydrology",
      "Nature Geoscience"
    ]
  },
  
  conferencePapers: {
    description: "Papers presented at academic conferences and symposiums",
    indicators: [
      "Conference proceedings",
      "Symposium papers",
      "Workshop presentations",
      "IGARSS, AGU, EGU proceedings"
    ]
  },
  
  academicTheses: {
    description: "Master's theses, doctoral dissertations, and graduate research",
    indicators: [
      "ProQuest Dissertations database",
      "University repositories",
      "Thesis/dissertation keywords in title",
      "Graduate school publications"
    ]
  },
  
  technicalReports: {
    description: "Government and institutional technical reports",
    indicators: [
      "DTIC (Defense Technical Information Center)",
      "NASA technical reports",
      "Government agency publications",
      "Institutional white papers"
    ]
  },
  
  onlineResources: {
    description: "Preprints, working papers, and web publications",
    indicators: [
      "arXiv preprints",
      "ResearchGate publications",
      "Academia.edu papers",
      "Institutional websites",
      "No formal peer review process"
    ]
  },
  
  popularPress: {
    description: "News articles, magazine features, and public communications",
    indicators: [
      "News websites",
      "Magazine articles",
      "Blog posts",
      "Public outreach materials"
    ]
  }
};

// Distribution insights based on RAPID dataset analysis
export const distributionInsights = {
  totalRecords: 265,
  
  keyFindings: [
    "40.4% are peer-reviewed journal articles, indicating strong academic rigor",
    "38.1% are online resources, showing active preprint and working paper culture", 
    "9.1% are academic theses, demonstrating educational impact",
    "5.7% are conference papers, suggesting selective conference participation",
    "4.9% are technical reports, mainly from government agencies",
    "1.9% are popular press, indicating limited public outreach"
  ],
  
  topJournalPublishers: [
    "Wiley Online Library: 58 publications",
    "Elsevier: 49 publications", 
    "Copernicus Publications: 18 publications (hess, gmd, nhess)",
    "Taylor & Francis: 8 publications",
    "Springer: 6 publications"
  ],
  
  academicImpact: {
    highImpactJournals: [
      "Nature Geoscience",
      "Water Resources Research", 
      "Hydrological Processes",
      "Journal of Hydrology"
    ],
    averageCitationsPerType: {
      peerReviewed: 45.2,
      online: 18.7,
      thesis: 12.3,
      conference: 8.9,
      techReport: 6.1,
      popularPress: 2.4
    }
  },
  
  temporalTrends: {
    2011: "Early adoption phase with limited publications",
    2015: "Growth in journal publications",
    2018: "Peak in conference presentations", 
    2021: "Increase in online preprints and working papers",
    2023: "Record year with balanced distribution across types"
  }
};

export default citationTypeData;
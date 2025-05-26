// src/data/citationData.js
// Annual citation data based on rapid_20250523.json analysis
// Data extracted from RAPID (Routing Application for Parallel computatIon of Discharge) citations

const citationData = [
  { year: 2011, annual: 2, cumulative: 2, peerReviewed: 1, other: 1, growthRate: null },
  { year: 2012, annual: 1, cumulative: 3, peerReviewed: 0, other: 1, growthRate: -50 },
  { year: 2013, annual: 4, cumulative: 7, peerReviewed: 4, other: 0, growthRate: 300 },
  { year: 2014, annual: 7, cumulative: 14, peerReviewed: 1, other: 6, growthRate: 75 },
  { year: 2015, annual: 12, cumulative: 26, peerReviewed: 7, other: 5, growthRate: 71 },
  { year: 2016, annual: 18, cumulative: 44, peerReviewed: 12, other: 6, growthRate: 50 },
  { year: 2017, annual: 16, cumulative: 60, peerReviewed: 8, other: 8, growthRate: -11 },
  { year: 2018, annual: 31, cumulative: 91, peerReviewed: 19, other: 12, growthRate: 94 },
  { year: 2019, annual: 23, cumulative: 114, peerReviewed: 13, other: 10, growthRate: -26 },
  { year: 2020, annual: 21, cumulative: 135, peerReviewed: 11, other: 10, growthRate: -9 },
  { year: 2021, annual: 30, cumulative: 165, peerReviewed: 20, other: 10, growthRate: 43 },
  { year: 2022, annual: 22, cumulative: 187, peerReviewed: 10, other: 12, growthRate: -27 },
  { year: 2023, annual: 35, cumulative: 222, peerReviewed: 21, other: 14, growthRate: 59 },
  { year: 2024, annual: 22, cumulative: 244, peerReviewed: 12, other: 10, growthRate: -37 },
  { year: 2025, annual: 15, cumulative: 259, peerReviewed: 14, other: 1, growthRate: -32 }
];

// Additional metadata from the analysis
export const citationMetadata = {
  totalPublications: 259,
  totalRecords: 265, // Some records may be outside 2011-2025 range
  peakYear: 2023,
  peakAnnualCount: 35,
  dataSource: "rapid_20250523.json",
  lastUpdated: "2025-01-25",
  
  // Research domain distribution (top 5)
  topDomains: [
      "Flood Prediction: 48",
      "River Modeling: 34", 
      "Streamflow: 18",
      "Hydrologic Modeling: 16",
      "Water Resources: 13"
  ],
  
  // Geographic distribution (top 5)
  topCountries: [
      "Unknown: 115",
      "USA: 33",
      "Not specified: 24",
      "Unspecified: 12",
      "Global: 9"
  ],
  
  // Publisher distribution (top 5)
  topPublishers: [
      "Wiley Online Library: 58",
      "Elsevier: 49", 
      "search.proquest.com: 24",
      "hess.copernicus.org: 9",
      "Taylor & Francis: 8"
  ],

  // Citation statistics
  totalCitations: 8684, // Sum of all cites field values across all records
  averageCitationsPerPaper: 32.8,
  mostCitedPaper: {
      title: "Global river hydrography and network routing: baseline data and new approaches to study the world's large river systems",
      citations: 1579,
      year: 2013,
      authors: ["B Lehner", "G Grill"],
      source: "Hydrological Processes"
  }
};

export default citationData;
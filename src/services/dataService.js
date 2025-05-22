// src/services/dataService.js
// Service for fetching and processing data

import { parseCSVData } from '../utils/dataUtils';

/**
 * Fetch citation data from CSV file
 * @returns {Promise} - Promise resolving to citation data
 */
export const fetchCitationData = async () => {
  try {
    const response = await fetch('/data/rapid_265citations.csv');
    const csvData = await response.text();
    return parseCSVData(csvData);
  } catch (error) {
    console.error('Error fetching citation data:', error);
    return [];
  }
};

/**
 * Process raw citation data into format needed for visualization
 * @param {Array} rawData - Raw citation data
 * @returns {Object} - Processed data for various dashboard components
 */
export const processCitationData = (rawData) => {
  // Calculate citation metrics
  const totalCitations = rawData.length;
  
  // Group by year
  const byYear = rawData.reduce((acc, citation) => {
    const year = citation.Year ? parseInt(citation.Year) : null;
    if (!year) return acc;
    
    if (!acc[year]) {
      acc[year] = {
        count: 0,
        peerReviewed: 0
      };
    }
    
    acc[year].count++;
    
    // Check if peer-reviewed
    if (citation.Type === 'Journal' || 
        (citation.Source && citation.Source.toLowerCase().includes('journal'))) {
      acc[year].peerReviewed++;
    }
    
    return acc;
  }, {});
  
  // Convert to time series data
  const years = Object.keys(byYear).sort();
  let cumulative = 0;
  const timeSeries = years.map(year => {
    const annual = byYear[year].count;
    cumulative += annual;
    
    return {
      year: parseInt(year),
      annual,
      cumulative,
      peerReviewed: byYear[year].peerReviewed,
      other: annual - byYear[year].peerReviewed
    };
  });
  
  // Add growth rates
  for (let i = 1; i < timeSeries.length; i++) {
    const prevYear = timeSeries[i-1];
    const currYear = timeSeries[i];
    
    currYear.growthRate = prevYear.annual > 0 
      ? Math.round((currYear.annual - prevYear.annual) / prevYear.annual * 100)
      : null;
  }
  
  return {
    totalCitations,
    timeSeries
  };
};

/**
 * Extract research domains from citation data
 * @param {Array} citations - Citation data
 * @returns {Array} - Research domains with counts
 */
export const extractResearchDomains = (citations) => {
  const domains = {};
  
  // Keywords to look for in titles and abstracts
  const domainKeywords = {
    'River Modeling': ['river', 'routing', 'channel', 'network'],
    'Water Resources': ['water', 'resources', 'hydro', 'reservoir'],
    'Flow Analysis': ['flow', 'discharge', 'runoff', 'streamflow'],
    'Flood Prediction': ['flood', 'inundation', 'prediction', 'forecast'],
    'Streamflow': ['streamflow', 'stream', 'measurement', 'gauge']
  };
  
  citations.forEach(citation => {
    const text = `${citation.Title || ''} ${citation.Abstract || ''}`.toLowerCase();
    
    Object.entries(domainKeywords).forEach(([domain, keywords]) => {
      if (!domains[domain]) domains[domain] = 0;
      
      // Check if any keyword is in the text
      if (keywords.some(keyword => text.includes(keyword))) {
        domains[domain]++;
      }
    });
  });
  
  // Convert to array and sort by count
  return Object.entries(domains)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};
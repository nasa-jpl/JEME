// src/utils/dataUtils.js
// Utility functions for data processing

/**
 * Calculate growth percentage between two values
 * @param {number} currentValue - Current value
 * @param {number} previousValue - Previous value
 * @returns {number} - Growth percentage
 */
export const calculateGrowthPercentage = (currentValue, previousValue) => {
    if (previousValue === 0) return 0;
    return ((currentValue - previousValue) / previousValue) * 100;
  };
  
  /**
   * Format a number as a percentage string
   * @param {number} value - Value to format
   * @param {number} decimals - Number of decimal places (default: 1)
   * @returns {string} - Formatted percentage 
   */
  export const formatPercentage = (value, decimals = 1) => {
    return `${value.toFixed(decimals)}%`;
  };
  
  /**
   * Group citations by category or attribute
   * @param {Array} citations - Citation data array
   * @param {string} groupByField - Field to group by
   * @returns {Object} - Grouped data
   */
  export const groupCitationsByAttribute = (citations, groupByField) => {
    return citations.reduce((groups, citation) => {
      const key = citation[groupByField];
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(citation);
      return groups;
    }, {});
  };
  
  /**
   * Calculate cumulative citations over time
   * @param {Array} annualData - Array of annual citation data
   * @returns {Array} - Array with cumulative values added
   */
  export const calculateCumulativeData = (annualData) => {
    let cumulative = 0;
    return annualData.map(year => {
      cumulative += year.value;
      return {
        ...year,
        cumulative: cumulative
      };
    });
  };
  
  /**
   * Parse CSV data into citation objects
   * @param {string} csvData - Raw CSV data string
   * @returns {Array} - Array of citation objects
   */
  export const parseCSVData = (csvData) => {
    // Implementation would depend on CSV structure
    // This is a simplified example
    const lines = csvData.split('\n');
    const headers = lines[0].split(',');
    
    return lines.slice(1).map(line => {
      if (!line.trim()) return null;
      
      const values = line.split(',');
      return headers.reduce((obj, header, index) => {
        obj[header.trim()] = values[index];
        return obj;
      }, {});
    }).filter(item => item !== null);
  };

// NEW FUNCTIONS FOR MODEL PROCESSING

// Extract standardized publication data from any model's JSON
export const extractPublicationData = (entry) => {
  try {
    return {
      title: entry.title?.[0] || 'Untitled',
      authors: entry.author?.map(a => `${a.given || ''} ${a.family || ''}`.trim()) || [],
      year: entry['published-print']?.['date-parts']?.[0]?.[0] || null,
      month: entry['published-print']?.['date-parts']?.[0]?.[1] || null,
      citations: entry['is-referenced-by-count'] || 0,
      doi: entry.DOI || '',
      models: entry.models || [],
      researchDomain: entry.research_domain || 'Unknown',
      abstract: entry.abstract || '',
      publisher: entry.publisher || 'Unknown',
      journal: entry['container-title']?.[0] || 'Unknown Journal',
      references: entry['reference-count'] || 0
    };
  } catch (error) {
    console.error('Error extracting publication data:', error);
    return null;
  }
};

// Process data for geographic visualization
export const processGeographicData = (citationsData) => {
  try {
    // For now, extract geographic info from abstracts and titles
    // This is a simplified approach - you may want to enhance this
    const geographicKeywords = {
      'United States': ['USA', 'United States', 'US ', 'America'],
      'Canada': ['Canada', 'Canadian'],
      'Brazil': ['Brazil', 'Brazilian', 'Amazon'],
      'China': ['China', 'Chinese'],
      'Europe': ['Europe', 'European'],
      'Australia': ['Australia', 'Australian'],
      'India': ['India', 'Indian'],
      'Global': ['global', 'worldwide', 'international']
    };

    const geographicData = [];
    
    citationsData.forEach(entry => {
      const extracted = extractPublicationData(entry);
      if (!extracted) return;
      
      const text = `${extracted.title} ${extracted.abstract}`.toLowerCase();
      
      for (const [region, keywords] of Object.entries(geographicKeywords)) {
        if (keywords.some(keyword => text.includes(keyword.toLowerCase()))) {
          geographicData.push({
            ...extracted,
            region,
            countries: region,
            watershed: region // Simplified for now
          });
          break; // Take first match
        }
      }
    });

    return geographicData;
  } catch (error) {
    console.error('Error processing geographic data:', error);
    return [];
  }
};

// Calculate metrics overview
export const calculateMetrics = (citationsData) => {
  try {
    if (!citationsData || !Array.isArray(citationsData) || citationsData.length === 0) {
      return {
        totalPapers: 0,
        totalCitations: 0,
        avgCitations: 0,
        totalDomains: 0,
        growthRate: 0,
        yearCounts: {},
        domains: []
      };
    }
    
    const publications = citationsData.map(extractPublicationData).filter(Boolean);
    
    const totalCitations = publications.reduce((sum, pub) => sum + pub.citations, 0);
    const totalPapers = publications.length;
    const avgCitations = totalPapers > 0 ? (totalCitations / totalPapers).toFixed(1) : 0;
    
    // Get unique domains
    const domains = [...new Set(publications.map(pub => pub.researchDomain))];
    
    // Get publication years for trend analysis
    const yearCounts = {};
    publications.forEach(pub => {
      if (pub.year) {
        yearCounts[pub.year] = (yearCounts[pub.year] || 0) + 1;
      }
    });
    
    // Calculate growth rate (comparing last 2 years)
    const years = Object.keys(yearCounts).map(Number).sort();
    const currentYear = Math.max(...years);
    const previousYear = currentYear - 1;
    const currentYearCount = yearCounts[currentYear] || 0;
    const previousYearCount = yearCounts[previousYear] || 0;
    const growthRate = previousYearCount > 0 ? 
      (((currentYearCount - previousYearCount) / previousYearCount) * 100).toFixed(1) : 0;

    return {
      totalPapers,
      totalCitations,
      avgCitations: parseFloat(avgCitations),
      totalDomains: domains.length,
      growthRate: parseFloat(growthRate),
      yearCounts,
      domains
    };
  } catch (error) {
    console.error('Error calculating metrics:', error);
    return {
      totalPapers: 0,
      totalCitations: 0,
      avgCitations: 0,
      totalDomains: 0,
      growthRate: 0,
      yearCounts: {},
      domains: []
    };
  }
};

// Process research domains data
export const processResearchDomains = (citationsData) => {
  try {
    const publications = citationsData.map(extractPublicationData).filter(Boolean);
    const domainStats = {};
    
    publications.forEach(pub => {
      const domain = pub.researchDomain;
      if (!domainStats[domain]) {
        domainStats[domain] = {
          name: domain,
          papers: 0,
          citations: 0,
          avgCitations: 0,
          publications: []
        };
      }
      
      domainStats[domain].papers += 1;
      domainStats[domain].citations += pub.citations;
      domainStats[domain].publications.push(pub);
    });
    
    // Calculate averages
    Object.values(domainStats).forEach(domain => {
      domain.avgCitations = domain.papers > 0 ? 
        (domain.citations / domain.papers).toFixed(1) : 0;
    });
    
    return Object.values(domainStats);
  } catch (error) {
    console.error('Error processing research domains:', error);
    return [];
  }
};

// Process citation trends by year
export const processCitationTrends = (citationsData) => {
  try {
    const publications = citationsData.map(extractPublicationData).filter(Boolean);
    const yearlyData = {};
    
    publications.forEach(pub => {
      if (pub.year) {
        if (!yearlyData[pub.year]) {
          yearlyData[pub.year] = {
            year: pub.year,
            papers: 0,
            citations: 0,
            cumulativePapers: 0,
            cumulativeCitations: 0
          };
        }
        
        yearlyData[pub.year].papers += 1;
        yearlyData[pub.year].citations += pub.citations;
      }
    });
    
    // Calculate cumulative values
    const sortedYears = Object.keys(yearlyData).map(Number).sort();
    let cumulativePapers = 0;
    let cumulativeCitations = 0;
    
    sortedYears.forEach(year => {
      cumulativePapers += yearlyData[year].papers;
      cumulativeCitations += yearlyData[year].citations;
      yearlyData[year].cumulativePapers = cumulativePapers;
      yearlyData[year].cumulativeCitations = cumulativeCitations;
    });
    
    return Object.values(yearlyData);
  } catch (error) {
    console.error('Error processing citation trends:', error);
    return [];
  }
};
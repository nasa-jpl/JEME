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
// Handles both Crossref format and simplified citation scraper format
export const extractPublicationData = (entry) => {
  try {
    // Detect format: Crossref has title as array, simplified has title as string
    const isCrossrefFormat = Array.isArray(entry.title);

    if (isCrossrefFormat) {
      // Crossref API format
      return {
        title: entry.title?.[0] || 'Untitled',
        authors: entry.author?.map(a => `${a.given || ''} ${a.family || ''}`.trim()) || [],
        year: entry['published-print']?.['date-parts']?.[0]?.[0] ||
              entry['published-online']?.['date-parts']?.[0]?.[0] ||
              entry['created']?.['date-parts']?.[0]?.[0] || null,
        month: entry['published-print']?.['date-parts']?.[0]?.[1] ||
               entry['published-online']?.['date-parts']?.[0]?.[1] || null,
        citations: Number(entry['is-referenced-by-count'] || entry.citations || entry.citation_count || 0),
        doi: entry.DOI || entry.doi || '',
        models: entry.models || [],
        researchDomain: entry.research_domain || 'Unknown',
        researchDomains: entry.research_domains || (entry.research_domain ? [entry.research_domain] : []),
        abstract: entry.abstract || '',
        publisher: entry.publisher || 'Unknown',
        journal: entry['container-title']?.[0] || 'Unknown Journal',
        references: entry['reference-count'] || 0,
        url: entry.URL || entry.url || '',
        citingTeamPaper: entry.citing_team_paper || null,
        teamPaperId: entry.team_paper_id || null,
        uncertainty: entry.uncertainty || null
      };
    } else {
      // Simplified citation scraper format
      return {
        title: entry.title || 'Untitled',
        authors: Array.isArray(entry.authors) ? entry.authors : [],
        year: entry.year || null,
        month: null,
        citations: Number(entry.citation_count || entry.citations || 0),
        doi: entry.doi || entry.DOI || '',
        models: entry.models || [],
        researchDomain: entry.research_domain || 'Unknown',
        researchDomains: entry.research_domains || (entry.research_domain ? [entry.research_domain] : []),
        abstract: entry.abstract || '',
        publisher: entry.publisher || 'Unknown',
        journal: entry.venue || entry.journal || 'Unknown Journal',
        references: 0,
        url: entry.url || '',
        paperId: entry.paper_id || null,
        citingTeamPaper: entry.citing_team_paper || null,
        teamPaperId: entry.team_paper_id || null,
        uncertainty: entry.uncertainty || null
      };
    }
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

// Process research domains data (supports multi-label research_domains array)
export const processResearchDomains = (citationsData) => {
  try {
    const publications = citationsData.map(extractPublicationData).filter(Boolean);
    const domainStats = {};

    publications.forEach(pub => {
      // Use multi-label domains if available, otherwise fall back to single domain
      const domains = (pub.researchDomains && pub.researchDomains.length > 0)
        ? pub.researchDomains
        : [pub.researchDomain];

      domains.forEach(domain => {
        if (!domain || domain === 'Unknown') return;
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

// ============================================
// MISSION/INSTRUMENT DATA PROCESSING
// ============================================

/**
 * Extract missions/instruments from a publication entry
 * @param {Object} entry - Publication entry with missions_instruments field
 * @returns {Array} - Array of mission objects
 */
export const extractMissions = (entry) => {
  if (!entry || !entry.missions_instruments) {
    return [];
  }
  return Array.isArray(entry.missions_instruments) ? entry.missions_instruments : [];
};

/**
 * Process all missions from citations data
 * @param {Array} citationsData - Array of publication entries
 * @returns {Object} - Processed mission statistics
 */
export const processMissionData = (citationsData) => {
  try {
    if (!citationsData || !Array.isArray(citationsData)) {
      return {
        totalMissions: 0,
        uniqueMissions: 0,
        byAgency: {},
        byType: {},
        byMission: {},
        topMissions: [],
        papersWithMissions: 0
      };
    }

    const allMissions = [];
    let papersWithMissions = 0;

    citationsData.forEach(entry => {
      const missions = extractMissions(entry);
      if (missions.length > 0) {
        papersWithMissions++;
        allMissions.push(...missions);
      }
    });

    // Group by agency
    const byAgency = {};
    allMissions.forEach(m => {
      const agency = m.agency || 'Unknown';
      if (!byAgency[agency]) {
        byAgency[agency] = { count: 0, missions: new Set() };
      }
      byAgency[agency].count++;
      byAgency[agency].missions.add(m.name);
    });

    // Convert Sets to arrays
    Object.keys(byAgency).forEach(agency => {
      byAgency[agency].missions = Array.from(byAgency[agency].missions);
    });

    // Group by type
    const byType = {};
    allMissions.forEach(m => {
      const type = m.type || 'Unknown';
      if (!byType[type]) {
        byType[type] = { count: 0, missions: new Set() };
      }
      byType[type].count++;
      byType[type].missions.add(m.name);
    });

    // Convert Sets to arrays
    Object.keys(byType).forEach(type => {
      byType[type].missions = Array.from(byType[type].missions);
    });

    // Group by mission name
    const byMission = {};
    allMissions.forEach(m => {
      const name = m.name || 'Unknown';
      if (!byMission[name]) {
        byMission[name] = {
          name: name,
          agency: m.agency || 'Unknown',
          type: m.type || 'Unknown',
          count: 0,
          products: new Set(),
          contexts: []
        };
      }
      byMission[name].count++;
      if (m.product && m.product !== 'Not specified') {
        byMission[name].products.add(m.product);
      }
      if (m.usage_context) {
        byMission[name].contexts.push(m.usage_context);
      }
    });

    // Convert Sets to arrays and create top missions list
    const topMissions = Object.values(byMission)
      .map(m => ({
        ...m,
        products: Array.from(m.products)
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalMissions: allMissions.length,
      uniqueMissions: Object.keys(byMission).length,
      byAgency,
      byType,
      byMission,
      topMissions,
      papersWithMissions
    };
  } catch (error) {
    console.error('Error processing mission data:', error);
    return {
      totalMissions: 0,
      uniqueMissions: 0,
      byAgency: {},
      byType: {},
      byMission: {},
      topMissions: [],
      papersWithMissions: 0
    };
  }
};

/**
 * Get mission statistics by geographic region
 * @param {Array} citationsData - Array of publication entries with geographic and mission data
 * @returns {Object} - Missions grouped by region
 */
export const getMissionsByRegion = (citationsData) => {
  try {
    const regionMissions = {};

    citationsData.forEach(entry => {
      const region = entry.region || entry.country || 'Unknown';
      const missions = extractMissions(entry);

      if (missions.length > 0) {
        if (!regionMissions[region]) {
          regionMissions[region] = {
            region,
            missions: {},
            totalUsages: 0
          };
        }

        missions.forEach(m => {
          const name = m.name || 'Unknown';
          if (!regionMissions[region].missions[name]) {
            regionMissions[region].missions[name] = {
              name,
              agency: m.agency,
              count: 0
            };
          }
          regionMissions[region].missions[name].count++;
          regionMissions[region].totalUsages++;
        });
      }
    });

    // Convert to array format
    return Object.values(regionMissions).map(r => ({
      ...r,
      missions: Object.values(r.missions).sort((a, b) => b.count - a.count)
    }));
  } catch (error) {
    console.error('Error getting missions by region:', error);
    return [];
  }
};

/**
 * Get agency color for visualization
 * @param {string} agency - Agency name
 * @returns {string} - Color hex code
 */
export const getAgencyColor = (agency) => {
  const colors = {
    'NASA': '#0B3D91',      // NASA blue
    'ESA': '#003247',       // ESA dark blue
    'JAXA': '#E60012',      // JAXA red
    'NOAA': '#003087',      // NOAA blue
    'ECMWF': '#1E4D8C',     // ECMWF blue
    'USGS': '#006400',      // USGS green
    'Other': '#6B7280',     // Gray
    'Unknown': '#9CA3AF'    // Light gray
  };
  return colors[agency] || colors['Other'];
};

/**
 * Get mission type icon name (for lucide-react)
 * @param {string} type - Mission type
 * @returns {string} - Icon name
 */
export const getMissionTypeIcon = (type) => {
  const icons = {
    'Satellite': 'satellite',
    'Instrument': 'radio',
    'Sensor': 'scan',
    'Data Product': 'database',
    'Reanalysis': 'refresh-cw',
    'Model Output': 'cpu',
    'Unknown': 'help-circle'
  };
  return icons[type] || icons['Unknown'];
};
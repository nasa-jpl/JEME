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
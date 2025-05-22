// src/utils/chartUtils.js
// Utility functions for chart formatting and configuration

/**
 * Format number with unit suffix (K, M, B)
 * @param {number} value - Value to format
 * @returns {string} Formatted value with suffix
 */
export const formatNumberWithSuffix = (value) => {
    if (value >= 1000000000) {
      return (value / 1000000000).toFixed(1) + 'B';
    }
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    }
    if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
  };
  
  /**
   * Generate a color array based on a base color
   * @param {string} baseColor - Base color in hex format
   * @param {number} steps - Number of colors to generate
   * @returns {Array} Array of colors
   */
  export const generateColorPalette = (baseColor, steps) => {
    // This is a simplified implementation
    const colors = [];
    const baseOpacity = 1;
    
    for (let i = 0; i < steps; i++) {
      const opacity = baseOpacity - (i * 0.7 / steps);
      colors.push(`${baseColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`);
    }
    
    return colors;
  };
  
  /**
   * Format percentage for display
   * @param {number} value - Value to format
   * @returns {string} Formatted percentage
   */
  export const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };
  
  /**
   * Generate custom tooltip formatter for charts
   * @param {string} label - Label for tooltip
   * @param {string} unit - Unit for the value
   * @returns {Function} Tooltip formatter function
   */
  export const createTooltipFormatter = (label, unit = '') => {
    return (value) => [`${value}${unit}`, label];
  };
  
  /**
   * Responsive breakpoints for charts
   */
  export const chartBreakpoints = {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200
  };
  
  /**
   * Default chart margins
   */
  export const defaultChartMargins = {
    top: 20,
    right: 30,
    left: 20,
    bottom: 20
  };
  
  /**
   * Chart theme configuration for consistent styling
   */
  export const chartTheme = {
    // Axes
    axis: {
      domain: {
        line: {
          stroke: '#E5E7EB',
          strokeWidth: 1
        }
      },
      ticks: {
        line: {
          stroke: '#E5E7EB',
          strokeWidth: 1
        },
        text: {
          fill: '#6B7280',
          fontSize: 12
        }
      },
      legend: {
        text: {
          fill: '#374151',
          fontSize: 12,
          fontWeight: 500
        }
      }
    },
    // Grid
    grid: {
      line: {
        stroke: '#F3F4F6',
        strokeWidth: 1,
        strokeDasharray: '3 3'
      }
    },
    // Tooltip
    tooltip: {
      container: {
        background: '#FFFFFF',
        fontSize: 12,
        borderRadius: 4,
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        padding: 12
      }
    }
  };
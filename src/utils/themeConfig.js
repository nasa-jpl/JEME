// src/utils/themeConfig.js
// Dashboard theme configuration

import colors from './colors';

const themeConfig = {
  // Color themes
  colorTheme: 'light', // 'light' or 'dark'
  
  // Card styling
  card: {
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    padding: '1.25rem',
    background: '#FFFFFF',
    border: '1px solid #F3F4F6'
  },
  
  // Typography
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
    headings: {
      h1: {
        fontSize: '1.5rem',
        fontWeight: '600',
        lineHeight: '2rem',
        color: colors.gray900
      },
      h2: {
        fontSize: '1.25rem',
        fontWeight: '600',
        lineHeight: '1.75rem',
        color: colors.gray800
      },
      h3: {
        fontSize: '1rem',
        fontWeight: '600',
        lineHeight: '1.5rem',
        color: colors.gray800
      },
      h4: {
        fontSize: '0.875rem',
        fontWeight: '600',
        lineHeight: '1.25rem',
        color: colors.gray700
      }
    },
    body: {
      regular: {
        fontSize: '0.875rem',
        lineHeight: '1.25rem',
        color: colors.gray700
      },
      small: {
        fontSize: '0.75rem',
        lineHeight: '1rem',
        color: colors.gray500
      }
    }
  },
  
  // Spacing
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem'
  },
  
  // Breakpoints
  breakpoints: {
    xs: '0px',
    sm: '576px',
    md: '768px',
    lg: '992px',
    xl: '1200px',
    xxl: '1400px'
  },
  
  // Dashboard layout
  layout: {
    maxWidth: '1320px',
    containerPadding: '1rem',
    sidebarWidth: '280px',
    topbarHeight: '64px'
  },
  
  // Button styles
  buttons: {
    primary: {
      background: colors.primary,
      hoverBackground: colors.primaryDark,
      textColor: '#FFFFFF',
      borderRadius: '0.375rem',
      padding: '0.5rem 1rem',
      fontSize: '0.875rem',
      fontWeight: '500'
    },
    secondary: {
      background: '#FFFFFF',
      hoverBackground: colors.gray100,
      textColor: colors.gray700,
      borderColor: colors.gray300,
      borderRadius: '0.375rem',
      padding: '0.5rem 1rem',
      fontSize: '0.875rem',
      fontWeight: '500'
    }
  },
  
  // Input styles
  inputs: {
    regular: {
      background: '#FFFFFF',
      border: `1px solid ${colors.gray300}`,
      borderRadius: '0.375rem',
      padding: '0.5rem 0.75rem',
      fontSize: '0.875rem',
      lineHeight: '1.25rem',
      focus: {
        borderColor: colors.primary,
        ringColor: `${colors.primary}33`, // 20% opacity
        ringWidth: '4px'
      }
    },
    search: {
      background: '#FFFFFF',
      border: `1px solid ${colors.gray300}`,
      borderRadius: '9999px',
      padding: '0.5rem 1rem 0.5rem 2.5rem',
      fontSize: '0.875rem',
      lineHeight: '1.25rem'
    }
  }
};

export default themeConfig;
// src/contexts/ThemeContext.js
// Theme context for application-wide theming

import React, { createContext, useState, useContext, useEffect } from 'react';
import themeConfig from '../utils/themeConfig';

// Create theme context
const ThemeContext = createContext();

// Theme provider component
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(themeConfig);
  const [colorMode, setColorMode] = useState('light');
  
  // Toggle between light and dark mode
  const toggleColorMode = () => {
    setColorMode(prevMode => prevMode === 'light' ? 'dark' : 'light');
  };
  
  // Update theme based on color mode
  useEffect(() => {
    if (colorMode === 'dark') {
      setTheme({
        ...themeConfig,
        colorTheme: 'dark',
        card: {
          ...themeConfig.card,
          background: '#1F2937',
          border: '1px solid #374151'
        },
        typography: {
          ...themeConfig.typography,
          headings: {
            h1: { ...themeConfig.typography.headings.h1, color: '#F9FAFB' },
            h2: { ...themeConfig.typography.headings.h2, color: '#F3F4F6' },
            h3: { ...themeConfig.typography.headings.h3, color: '#E5E7EB' },
            h4: { ...themeConfig.typography.headings.h4, color: '#D1D5DB' }
          },
          body: {
            regular: { ...themeConfig.typography.body.regular, color: '#E5E7EB' },
            small: { ...themeConfig.typography.body.small, color: '#9CA3AF' }
          }
        }
      });
    } else {
      setTheme(themeConfig);
    }
  }, [colorMode]);
  
  // Provide theme and theme control functions
  return (
    <ThemeContext.Provider 
      value={{ 
        theme, 
        colorMode, 
        toggleColorMode 
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
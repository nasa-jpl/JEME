// src/contexts/DataContext.js
// Simplified data context for managing citation data

import React, { createContext, useState, useContext } from 'react';
import citationData from '../data/citationData';
import domainData from '../data/domainData';

// Create data context
const DataContext = createContext();

// Data provider component
export const DataProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Processed data (simplified for this version)
  const processedData = {
    totalCitations: 265,
    timeSeries: citationData,
    domains: domainData
  };
  
  // Filter options
  const [filters, setFilters] = useState({
    yearRange: [2011, 2025],
    citationType: 'all',
    researchDomain: 'all'
  });
  
  // Apply filters to data
  const applyFilters = (newFilters) => {
    setFilters(newFilters);
  };
  
  // Simplified refresh data function
  const refreshData = () => {
    console.log('Data refresh requested');
  };
  
  // Provide data and data control functions
  return (
    <DataContext.Provider
      value={{
        isLoading,
        error,
        citationData,
        processedData,
        filters,
        applyFilters,
        refreshData
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

// Custom hook to use data
export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export default DataContext;
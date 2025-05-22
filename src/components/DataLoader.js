// src/components/DataLoader.js
// Component for loading data with error handling and loading states

import React from 'react';
import LoadingSpinner from './LoadingSpinner';

const DataLoader = ({ 
  isLoading, 
  error, 
  data, 
  loadingMessage = "Loading data...", 
  errorMessage = "There was an error loading the data.",
  emptyMessage = "No data available.", 
  children 
}) => {
  // Show loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 flex justify-center items-center h-64">
        <div className="text-center">
          <LoadingSpinner size="medium" />
          <p className="text-gray-600 mt-4">{loadingMessage}</p>
        </div>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center text-red-600">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-12 w-12 mx-auto mb-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          <p className="text-lg font-semibold mb-2">{errorMessage}</p>
          <p className="text-sm text-gray-600">{error.message || "Please try again later."}</p>
          
          {/* Optional: Add a retry button if a retry function is provided */}
          {error.retry && (
            <button 
              onClick={error.retry}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }
  
  // Show empty state if data is empty or null
  if (!data || (Array.isArray(data) && data.length === 0) || (typeof data === 'object' && Object.keys(data).length === 0)) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center text-gray-600">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-12 w-12 mx-auto mb-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" 
            />
          </svg>
          <p className="text-lg font-semibold">{emptyMessage}</p>
        </div>
      </div>
    );
  }
  
  // Render children with the data
  return children(data);
};

export default DataLoader;
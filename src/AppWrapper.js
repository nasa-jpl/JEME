// src/AppWrapper.js
// Application wrapper with providers

import React from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { DataProvider } from './contexts/DataContext';
import ErrorBoundary from './components/ErrorBoundary';
import App from './App';

const AppWrapper = () => {
  return (
    <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
      <ThemeProvider>
        <DataProvider>
          <App />
        </DataProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default AppWrapper;
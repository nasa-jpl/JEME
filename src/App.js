// src/App.js
// Main application component with provider context wrappers

import React from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { DataProvider } from './contexts/DataContext';
import ErrorBoundary from './components/ErrorBoundary';
import AppWithRouting from './AppWithRouting';

function App() {
  return (
    <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
      <ThemeProvider>
        <DataProvider>
          <AppWithRouting />
        </DataProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
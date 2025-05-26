// src/AppWithRouting.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './views/Dashboard';
import CitationsPage from './views/CitationsPage';
import GeographicImpactPage from './views/GeographicImpactPage';
import ResearchDomainsPage from './views/ResearchDomainsPage';

function AppWithRouting() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default route redirects to Dashboard */}
        <Route path="/" element={<Dashboard />} />
        
        {/* Other routes */}
        <Route path="/citations" element={<CitationsPage />} />
        <Route path="/geographic-impact" element={<GeographicImpactPage />} />
        <Route path="/research-domains" element={<ResearchDomainsPage />} />
        
        {/* Fallback route for any unmatched paths */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppWithRouting;
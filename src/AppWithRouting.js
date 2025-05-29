// src/AppWithRouting.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './views/Dashboard';
import CitationsPage from './views/CitationsPage';
import GeographicImpactPage from './views/GeographicImpactPage';
import ResearchDomainsPage from './views/ResearchDomainsPage';

import CMS_Flux_Dashboard from './views/CMS-Flux/Dashboard';


function AppWithRouting() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default route redirects to Dashboard */}
        <Route path="/science-model-dashboard" element={<Dashboard />} />
        <Route path="/science-model-dashboard/CMS-Flux" element={<CMS_Flux_Dashboard />} />
        
        {/* Other routes */}
        <Route path="/citations" element={<CitationsPage />} />
        <Route path="/geographic-impact" element={<GeographicImpactPage />} />
        <Route path="/research-domains" element={<ResearchDomainsPage />} />
        
        {/* Fallback route for any unmatched paths */}
        <Route path="*" element={<Navigate to="/science-model-dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppWithRouting;
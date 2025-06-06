// src/AppWithRouting.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './views/Dashboard';
import CitationsPage from './views/CitationsPage';
import GeographicImpactPage from './views/GeographicImpactPage';
import ResearchDomainsPage from './views/ResearchDomainsPage';

//import CMS_Flux_Dashboard from './views/CMS-Flux/Dashboard';

import CARDAMOM_Dashboard from './views/CARDAMOM/Dashboard';
import CARDAMOM_CitationsPage from './views/CARDAMOM/CitationsPage';
import CARDAMOM_GeographicImpactPage from './views/CARDAMOM/GeographicImpactPage';
import CARDAMOM_ResearchDomainsPage from './views/CARDAMOM/ResearchDomainsPage';


function AppWithRouting() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default route redirects to Dashboard */}
        <Route path="/science-model-dashboard" element={<Dashboard />} />
        <Route path="/science-model-dashboard/CARDAMOM" element={<CARDAMOM_Dashboard />} />
        
        {/* Other routes */}
        <Route path="/citations" element={<CitationsPage />} />
        <Route path="/geographic-impact" element={<GeographicImpactPage />} />
        <Route path="/research-domains" element={<ResearchDomainsPage />} />
        
        {/* CARDAMOM specific routes */}
        <Route path="/science-model-dashboard/CARDAMOM/citations" element={<CARDAMOM_CitationsPage />} />
        <Route path="/science-model-dashboard/CARDAMOM/geographic-impact" element={<CARDAMOM_GeographicImpactPage />} />
        <Route path="/science-model-dashboard/CARDAMOM/research-domains" element={<CARDAMOM_ResearchDomainsPage />} />

        

        {/* Fallback route for any unmatched paths */}
        <Route path="*" element={<Navigate to="/science-model-dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppWithRouting;
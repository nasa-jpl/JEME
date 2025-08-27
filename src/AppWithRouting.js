// src/AppWithRouting.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './views/Dashboard';
import CitationsPage from './views/CitationsPage';
import GeographicImpactPage from './views/GeographicImpactPage';
import ResearchDomainsPage from './views/ResearchDomainsPage';

// Generic page components that work with any model
import GenericCitationsPage from './views/GenericCitationsPage';
import GenericGeographicImpactPage from './views/GenericGeographicImpactPage';
import GenericResearchDomainsPage from './views/GenericResearchDomainsPage';

// Model-specific dashboards
import RAPIDDashboard from './views/RAPID/Dashboard';
import CMSFluxDashboard from './views/CMS-Flux/Dashboard';
import ECCODashboard from './views/ECCO/Dashboard';
import ISSMDashboard from './views/ISSM/Dashboard';
import MOMOCHEMDashboard from './views/MOMO-CHEM/Dashboard';
import CARDAMOM_Dashboard from './views/CARDAMOM/Dashboard';


function AppWithRouting() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main Dashboard */}
        <Route path="/science-model-dashboard" element={<Dashboard />} />
        
        {/* Model-specific dashboard routes */}
        <Route path="/science-model-dashboard/RAPID" element={<RAPIDDashboard />} />
        <Route path="/science-model-dashboard/CMS-Flux" element={<CMSFluxDashboard />} />
        <Route path="/science-model-dashboard/ECCO" element={<ECCODashboard />} />
        <Route path="/science-model-dashboard/ISSM" element={<ISSMDashboard />} />
        <Route path="/science-model-dashboard/MOMO-CHEM" element={<MOMOCHEMDashboard />} />
        <Route path="/science-model-dashboard/CARDAMOM" element={<CARDAMOM_Dashboard />} />
        
        {/* Legacy routes (keeping RAPID as default for backward compatibility) */}
        <Route path="/citations" element={<CitationsPage />} />
        <Route path="/geographic-impact" element={<GeographicImpactPage />} />
        <Route path="/research-domains" element={<ResearchDomainsPage />} />
        
        {/* Generic routes for all models - these work with any model name */}
        <Route path="/science-model-dashboard/:modelName/citations" element={<GenericCitationsPage />} />
        <Route path="/science-model-dashboard/:modelName/geographic-impact" element={<GenericGeographicImpactPage />} />
        <Route path="/science-model-dashboard/:modelName/research-domains" element={<GenericResearchDomainsPage />} />

        {/* Fallback route for any unmatched paths */}
        <Route path="*" element={<Navigate to="/science-model-dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppWithRouting;
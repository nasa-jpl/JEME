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

// Model-specific page components
import CMSFluxResearchDomainsPage from './views/CMS-Flux/ResearchDomainsPage';
import ECCOResearchDomainsPage from './views/ECCO/ResearchDomainsPage';
import ISSMResearchDomainsPage from './views/ISSM/ResearchDomainsPage';
import CARDAMOMResearchDomainsPage from './views/CARDAMOM/ResearchDomainsPage';
import MOMOCHEMResearchDomainsPage from './views/MOMO-CHEM/ResearchDomainsPage';

// Model-specific dashboards
import RAPIDDashboard from './views/RAPID/Dashboard';
import CMSFluxDashboard from './views/CMS-Flux/Dashboard';
import ECCODashboard from './views/ECCO/Dashboard';
import ISSMDashboard from './views/ISSM/Dashboard';
import MOMOCHEMDashboard from './views/MOMO-CHEM/Dashboard';
import CARDAMOMDashboard from './views/CARDAMOM/Dashboard';
import LESDashboard from './views/LES/Dashboard';
import EDMFDashboard from './views/EDMF/Dashboard';
import GRACEDashboard from './views/GRACE/Dashboard';
import SWOTDashboard from './views/SWOT/Dashboard';

// Uncertainty Analysis page
import GenericUncertaintyPage from './views/GenericUncertaintyPage';

// How It Works page
import HowItWorks from './views/HowItWorks';

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
        <Route path="/science-model-dashboard/CARDAMOM" element={<CARDAMOMDashboard />} />
        {/* LES and EDMF - Now with real citation data! */}
        <Route path="/science-model-dashboard/LES" element={<LESDashboard />} />
        <Route path="/science-model-dashboard/EDMF" element={<EDMFDashboard />} />
        {/* Mission dashboards */}
        <Route path="/science-model-dashboard/GRACE" element={<GRACEDashboard />} />
        <Route path="/science-model-dashboard/SWOT" element={<SWOTDashboard />} />

        {/* How It Works page */}
        <Route path="/science-model-dashboard/how-it-works" element={<HowItWorks />} />
        
        {/* Legacy routes (keeping RAPID as default for backward compatibility) */}
        <Route path="/citations" element={<CitationsPage />} />
        <Route path="/geographic-impact" element={<GeographicImpactPage />} />
        <Route path="/research-domains" element={<ResearchDomainsPage />} />
        
        {/* RAPID uses legacy pages directly */}
        
        {/* Model-specific routes */}
        <Route path="/science-model-dashboard/CMS-Flux/research-domains" element={<CMSFluxResearchDomainsPage />} />
        <Route path="/science-model-dashboard/ECCO/research-domains" element={<ECCOResearchDomainsPage />} />
        <Route path="/science-model-dashboard/ISSM/research-domains" element={<ISSMResearchDomainsPage />} />
        <Route path="/science-model-dashboard/CARDAMOM/research-domains" element={<CARDAMOMResearchDomainsPage />} />
        <Route path="/science-model-dashboard/MOMO-CHEM/research-domains" element={<MOMOCHEMResearchDomainsPage />} />
        
        {/* Generic routes for all models - these work with any model name */}
        <Route path="/science-model-dashboard/:modelName/citations" element={<GenericCitationsPage />} />
        <Route path="/science-model-dashboard/:modelName/geographic-impact" element={<GenericGeographicImpactPage />} />
        <Route path="/science-model-dashboard/:modelName/research-domains" element={<GenericResearchDomainsPage />} />
        <Route path="/science-model-dashboard/:modelName/uncertainty" element={<GenericUncertaintyPage />} />

        {/* Fallback route for any unmatched paths */}
        <Route path="*" element={<Navigate to="/science-model-dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppWithRouting;
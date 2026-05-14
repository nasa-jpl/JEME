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
import TROPESSDashboard from './views/TROPESS/Dashboard';
import JEOEDashboard from './views/JEOEDashboard';

// Uncertainty Analysis page
import GenericUncertaintyPage from './views/GenericUncertaintyPage';

// How It Works page
import HowItWorks from './views/HowItWorks';

// Earth System Interconnections page
import EarthSystemPage from './views/EarthSystemPage';

// Model Maturity pages
import ModelMaturityPage from './views/ModelMaturityPage';
import GenericMaturityPage from './views/GenericMaturityPage';

function AppWithRouting() {
  return (
    <BrowserRouter basename={process.env.PUBLIC_URL}>
      <Routes>
        {/* Main Dashboard */}
        <Route path="/" element={<Dashboard />} />

        {/* Model-specific dashboard routes */}
        <Route path="/RAPID" element={<RAPIDDashboard />} />
        <Route path="/CMS-Flux" element={<CMSFluxDashboard />} />
        <Route path="/ECCO" element={<ECCODashboard />} />
        <Route path="/ISSM" element={<ISSMDashboard />} />
        <Route path="/MOMO-CHEM" element={<MOMOCHEMDashboard />} />
        <Route path="/CARDAMOM" element={<CARDAMOMDashboard />} />
        {/* LES and EDMF - Now with real citation data! */}
        <Route path="/LES" element={<LESDashboard />} />
        <Route path="/EDMF" element={<EDMFDashboard />} />
        {/* JEOE Dashboard */}
        <Route path="/JEOE" element={<JEOEDashboard />} />
        {/* Mission dashboards */}
        <Route path="/GRACE" element={<GRACEDashboard />} />
        <Route path="/SWOT" element={<SWOTDashboard />} />
        <Route path="/TROPESS" element={<TROPESSDashboard />} />

        {/* Earth System Interconnections page */}
        <Route path="/earth-system" element={<EarthSystemPage />} />

        {/* Model Maturity pages */}
        <Route path="/model-maturity" element={<ModelMaturityPage />} />
        <Route path="/:modelName/maturity" element={<GenericMaturityPage />} />

        {/* How It Works page */}
        <Route path="/how-it-works" element={<HowItWorks />} />

        {/* Legacy routes (keeping RAPID as default for backward compatibility) */}
        <Route path="/citations" element={<CitationsPage />} />
        <Route path="/geographic-impact" element={<GeographicImpactPage />} />
        <Route path="/research-domains" element={<ResearchDomainsPage />} />

        {/* Model-specific routes */}
        <Route path="/CMS-Flux/research-domains" element={<CMSFluxResearchDomainsPage />} />
        <Route path="/ECCO/research-domains" element={<ECCOResearchDomainsPage />} />
        <Route path="/ISSM/research-domains" element={<ISSMResearchDomainsPage />} />
        <Route path="/CARDAMOM/research-domains" element={<CARDAMOMResearchDomainsPage />} />
        <Route path="/MOMO-CHEM/research-domains" element={<MOMOCHEMResearchDomainsPage />} />

        {/* Generic routes for all models - these work with any model name */}
        <Route path="/:modelName/citations" element={<GenericCitationsPage />} />
        <Route path="/:modelName/geographic-impact" element={<GenericGeographicImpactPage />} />
        <Route path="/:modelName/research-domains" element={<GenericResearchDomainsPage />} />
        <Route path="/:modelName/uncertainty" element={<GenericUncertaintyPage />} />

        {/* Fallback route for any unmatched paths */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppWithRouting;

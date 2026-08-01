// TROPESS Data Products & Downloads page
//
// Audience: data users. Covers the published GES DISC product catalog and the
// download metrics (monthly, cumulative, by product/processing type, by
// species, megacity, and country). Science-impact content (citations,
// research domains) lives on the companion page at /TROPESS.

import React from 'react';
import { Satellite } from 'lucide-react';
import NavBar from '../../components/NavBar';
import Footer from '../../components/Footer';
import ModelInfoSection from '../../components/ModelInfoSection';
import MonthlyReportSection from '../../components/tropess/MonthlyReportSection';
import TropessPageTabs from '../../components/tropess/TropessPageTabs';

const TROPESSDataProducts = () => (
  <div className="bg-gray-100 min-h-screen">
    <NavBar activeItem="TROPESS" />

    <main className="max-w-7xl mx-auto px-4 py-6">
      <div className="bg-white rounded-lg p-6 shadow-sm mb-6 border-t-4 border-sky-600">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-50 rounded-lg">
            <Satellite size={24} className="text-sky-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">TROPESS Data Products & Downloads</h1>
            <p className="text-gray-500 text-sm mt-1">
              Published data products and download usage for the TROPospheric Emission
              Spectrometer System, distributed by NASA GES DISC
            </p>
          </div>
        </div>
      </div>

      <TropessPageTabs active="data-products" />

      <ModelInfoSection modelName="TROPESS" modelDisplayName="TROPESS" />

      <MonthlyReportSection />

      <Footer isJEOE />
    </main>
  </div>
);

export default TROPESSDataProducts;

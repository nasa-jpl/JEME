// src/views/Dashboard.js
// Main dashboard view that combines all components

import React, { useState, useEffect } from 'react';
import { Zap, Wind, Waves, Mountain, Atom, Leaf } from 'lucide-react';
import { Link } from 'react-router-dom';

// Import components
import Footer from '../components/Footer';

// Import chart components
import ModelComparisonChart from '../components/charts/ModelComparisonChart';
import MultiModelCitationTrendsChart from '../components/charts/MultiModelCitationTrendsChart';

const Dashboard = () => {
  const [allModelsData, setAllModelsData] = useState({});
  const [loading, setLoading] = useState(true);

  // Load all models' data for multi-model comparison
  useEffect(() => {
    const loadAllModelsData = async () => {
      try {
        const [rapidModule, cmsFluxModule, eccoModule, issmModule, momoChemModule, cardamomModule] = await Promise.all([
          import('../data/RAPID_analyzed.json'),
          import('../data/CMS-Flux_analyzed.json'),
          import('../data/ECCO_analyzed.json'),
          import('../data/ISSM_analyzed.json'),
          import('../data/MOMO-CHEM_analyzed.json'),
          import('../data/CARDAMOM_analyzed.json')
        ]);

        setAllModelsData({
          RAPID: rapidModule.default || rapidModule,
          'CMS-Flux': cmsFluxModule.default || cmsFluxModule,
          ECCO: eccoModule.default || eccoModule,
          ISSM: issmModule.default || issmModule,
          'MOMO-CHEM': momoChemModule.default || momoChemModule,
          CARDAMOM: cardamomModule.default || cardamomModule
        });
        setLoading(false);
      } catch (error) {
        console.error('Failed to load models data:', error);
        setLoading(false);
      }
    };

    loadAllModelsData();
  }, []);

  const models = [
    {
      name: "RAPID",
      icon: <Zap size={20} style={{ color: '#3b82f6' }} />,  // Blue
      description: "Routing Application for Parallel computation of Discharge - River network routing model for large-scale hydrodynamic simulations",
      link: "/science-model-dashboard"
    },
    {
      name: "CMS-Flux",
      icon: <Wind size={20} style={{ color: '#10b981' }} />,  // Green
      description: "Carbon Monitoring System Flux - Atmospheric CO2 inversion system for quantifying carbon sources and sinks",
      link: "/science-model-dashboard/CMS-Flux"
    },
    {
      name: "ECCO",
      icon: <Waves size={20} style={{ color: '#f97316' }} />,  // Orange
      description: "Estimating the Circulation and Climate of the Ocean - Global ocean state estimation system combining models with observations",
      link: "/science-model-dashboard/ECCO"
    },
    {
      name: "ISSM",
      icon: <Mountain size={20} style={{ color: '#ef4444' }} />,  // Red
      description: "Ice Sheet System Model - Thermomechanical ice sheet model for simulating ice dynamics and sea level change",
      link: "/science-model-dashboard/ISSM"
    },
    {
      name: "MOMO-CHEM",
      icon: <Atom size={20} style={{ color: '#8b5cf6' }} />,  // Purple
      description: "Multi-scale Modeling of Atmospheric Chemistry - Chemical transport model for air quality and atmospheric composition studies",
      link: "/science-model-dashboard/MOMO-CHEM"
    },
    {
      name: "CARDAMOM",
      icon: <Leaf size={20} style={{ color: '#eab308' }} />,  // Yellow
      description: "Carbon Data Model Framework - Terrestrial carbon cycle data assimilation system for ecosystem carbon stock estimation",
      link: "/science-model-dashboard/CARDAMOM"
    }
  ];

  return (
    <div className="bg-gray-100 min-h-screen">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-400 rounded-md flex items-center justify-center text-white">
              <span className="font-bold">JEME</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-blue-900">JEME Publication Dashboard</h1>
              <p className="text-sm text-gray-600">JPL's Earth Modeling Enterprise</p>
            </div>
          </div>
          
          <div className="flex gap-8">
            <a href="#" className="text-blue-600 border-b-2 border-blue-600 font-medium text-sm">Dashboard</a>
            <Link to="/science-model-dashboard/RAPID" className="text-gray-600 hover:text-gray-800 font-medium text-sm">RAPID</Link>
            <Link to="/science-model-dashboard/CMS-Flux" className="text-gray-600 hover:text-gray-800 font-medium text-sm">CMS-Flux</Link>
            <Link to="/science-model-dashboard/ECCO" className="text-gray-600 hover:text-gray-800 font-medium text-sm">ECCO</Link>
            <Link to="/science-model-dashboard/ISSM" className="text-gray-600 hover:text-gray-800 font-medium text-sm">ISSM</Link>
            <Link to="/science-model-dashboard/MOMO-CHEM" className="text-gray-600 hover:text-gray-800 font-medium text-sm">MOMO-CHEM</Link>
            <Link to="/science-model-dashboard/CARDAMOM" className="text-gray-600 hover:text-gray-800 font-medium text-sm">CARDAMOM</Link>
            <Link to="/science-model-dashboard/how-it-works" className="text-gray-600 hover:text-gray-800 font-medium text-sm">How It Works</Link>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        
        {/* JEME Image */}
        <div className="mb-6">
          <img 
            src="/science-model-dashboard/JEME-1slide.jpg" 
            alt="JEME Presentation" 
            className="w-full rounded-lg shadow-sm"
          />
        </div>
        
        {/* Model Overview Section */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">JPL's Earth Modeling Enterprise (JEME) Publication Dashboard</h2>
            <p className="text-gray-600">
              Comprehensive publication dashboard of Earth system models for climate, hydrology, oceanography, and atmospheric research
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {models.map((model, index) => (
              <Link 
                key={index}
                to={model.link}
                className="group p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-blue-50 transition-colors">
                    {model.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-900 transition-colors">
                      {model.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                      {model.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg p-8 shadow-sm mb-6 text-center">
            <div className="text-gray-600">Loading data...</div>
          </div>
        ) : (
          <>
            {/* Multi-Model Comparison Section */}
            <ModelComparisonChart allModelsData={allModelsData} />

            {/* Citation trends across all models */}
            <MultiModelCitationTrendsChart allModelsData={allModelsData} />
          </>
        )}
        
        <Footer />
      </main>
    </div>
  );
};

export default Dashboard;
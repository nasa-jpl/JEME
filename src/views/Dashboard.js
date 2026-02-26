// src/views/Dashboard.js
// Main dashboard view that combines all components

import React, { useState, useEffect } from 'react';
import { Zap, Wind, Waves, Mountain, Atom, Leaf, CloudLightning, Layers, Satellite } from 'lucide-react';
import { Link } from 'react-router-dom';
import NavBar from '../components/NavBar';

// Import components
import Footer from '../components/Footer';
import JEMEContributionSection from '../components/JEMEContributionSection';

// Import chart components
import ModelComparisonChart from '../components/charts/ModelComparisonChart';
import MultiModelCitationTrendsChart from '../components/charts/MultiModelCitationTrendsChart';

// Import network analysis components
import NetworkInsightsCard from '../components/network/NetworkInsightsCard';
import ConnectionMatrix from '../components/network/ConnectionMatrix';
import BridgePapersTable from '../components/network/BridgePapersTable';
import NetworkGraph from '../components/network/NetworkGraph';

// Import network analysis utility
import { performNetworkAnalysis } from '../utils/networkAnalysis';

const Dashboard = () => {
  const [allModelsData, setAllModelsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [networkAnalysis, setNetworkAnalysis] = useState(null);
  const [networkLoading, setNetworkLoading] = useState(true);

  // Load all models' data for multi-model comparison
  useEffect(() => {
    const loadData = async () => {
      try {
        const { loadAllModelsData } = await import('../utils/dataLoader');
        const models = ['RAPID', 'CMS-Flux', 'ECCO', 'ISSM', 'MOMO-CHEM', 'CARDAMOM', 'LES', 'EDMF', 'GRACE', 'SWOT'];
        const data = await loadAllModelsData(models);
        setAllModelsData(data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load models data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Perform network analysis
  useEffect(() => {
    const runNetworkAnalysis = async () => {
      try {
        setNetworkLoading(true);
        console.log('Starting network analysis...');
        const analysis = await performNetworkAnalysis();
        setNetworkAnalysis(analysis);
        console.log('Network analysis complete:', analysis);
        setNetworkLoading(false);
      } catch (error) {
        console.error('Failed to perform network analysis:', error);
        setNetworkLoading(false);
      }
    };

    runNetworkAnalysis();
  }, []);

  const models = [
    {
      name: "RAPID",
      icon: <Zap size={20} style={{ color: '#3b82f6' }} />,  // Blue
      description: "Routing Application for Parallel computation of Discharge - River network routing model for large-scale hydrodynamic simulations",
      link: "/science-model-dashboard/RAPID"
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
    },
    {
      name: "LES",
      icon: <CloudLightning size={20} style={{ color: '#2E8B57' }} />,  // Sea Green
      description: "Large Eddy Simulation for Atmospheric Studies - High-resolution atmospheric modeling and boundary layer studies",
      link: "/science-model-dashboard/LES"
    },
    {
      name: "EDMF",
      icon: <Layers size={20} style={{ color: '#FF6347' }} />,  // Tomato
      description: "Eddy Diffusivity Mass Flux Scheme - Parameterization scheme for turbulent mixing and convective transport in atmospheric models",
      link: "/science-model-dashboard/EDMF"
    }
  ];

  return (
    <div className="bg-gray-100 min-h-screen">
      <NavBar activeItem="Dashboard" />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        
        {/* JEME Image */}
        <div className="mb-6">
          <img
            src="/science-model-dashboard/JEME-1slide.jpg"
            alt="JEME Presentation"
            className="w-full rounded-lg shadow-sm"
          />
        </div>

        {/* JEME Contribution Section */}
        <JEMEContributionSection />

        {/* Model Overview Section */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">JPL's Earth Modeling Enterprise (JEME) Dashboard</h2>
            <p className="text-gray-600">
              Comprehensive dashboard of Earth system models for climate, hydrology, oceanography, and atmospheric research
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

          {/* Missions subsection */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">NASA Missions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                to="/science-model-dashboard/GRACE"
                className="group p-4 border border-gray-200 rounded-lg hover:border-sky-300 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-sky-50 transition-colors">
                    <Satellite size={20} style={{ color: '#0369A1' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 group-hover:text-sky-900 transition-colors">
                      GRACE
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                      Gravity Recovery and Climate Experiment - Tracking changes in Earth's gravity field to monitor water storage, ice mass, and sea level
                    </p>
                  </div>
                </div>
              </Link>
              <Link
                to="/science-model-dashboard/SWOT"
                className="group p-4 border border-gray-200 rounded-lg hover:border-sky-300 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-sky-50 transition-colors">
                    <Satellite size={20} style={{ color: '#0E7490' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 group-hover:text-sky-900 transition-colors">
                      SWOT
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                      Surface Water and Ocean Topography - Ka-band radar interferometry for water surface elevation measurements
                    </p>
                  </div>
                </div>
              </Link>
            </div>
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

        {/* Network Analysis Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Cross-Model Network Analysis</h2>
          <p className="text-gray-600 mb-6">
            Explore connections between models through shared citations, bridge papers, and collaborative research
          </p>

          {networkLoading ? (
            <div className="bg-white rounded-lg p-8 shadow-sm mb-6 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <div className="text-gray-600">Analyzing network connections across {models.length} models...</div>
            </div>
          ) : networkAnalysis ? (
            <div className="space-y-6">
              {/* Network Insights Card */}
              <NetworkInsightsCard
                summary={networkAnalysis.summary}
                networkMetrics={networkAnalysis.networkMetrics}
              />

              {/* Network Graph */}
              <NetworkGraph
                connectionData={networkAnalysis.connectionData}
                networkMetrics={networkAnalysis.networkMetrics}
              />

              {/* Connection Matrix */}
              <ConnectionMatrix
                connectionData={networkAnalysis.connectionData}
              />

              {/* Bridge Papers Table */}
              <BridgePapersTable
                bridgePapers={networkAnalysis.bridgePapers}
              />
            </div>
          ) : (
            <div className="bg-white rounded-lg p-8 shadow-sm mb-6 text-center">
              <div className="text-gray-600">Failed to load network analysis</div>
            </div>
          )}
        </div>
        
        <Footer />
      </main>
    </div>
  );
};

export default Dashboard;
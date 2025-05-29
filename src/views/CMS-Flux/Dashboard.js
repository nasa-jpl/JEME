// src/views/Dashboard.js
// Main dashboard view that combines all components

import React from 'react';
import { Search, Bell, Settings, ExternalLink, Database, Globe, BarChart3, Zap, Wind, Waves, Mountain, Atom, Leaf } from 'lucide-react';
import { Link } from 'react-router-dom';

// Import components
import PaperInfo from '../../components/PaperInfo';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

// Import section components
import MetricsOverview from '../sections/MetricsOverview';

// Import chart components
import CitationTrendsChart from '../../components/charts/CitationTrendsChart';
import ModelComparisonChart from '../../components/charts/ModelComparisonChart';
import ResearchDomainsCard from '../../components/charts/ResearchDomainsCard';
import EngagementLevelsCard from '../../components/charts/EngagementLevelsCard';
import CitationTypeCard from '../../components/charts/CitationTypeCard';
import FutureTrendsChart from '../../components/charts/FutureTrendsChart'; 
import DashboardSummaryCard from '../../components/charts/DashboardSummaryCard';
import JournalDistributionCard from '../../components/charts/JournalDistributionCard';
import GitHubMetricsCard from '../../components/charts/GitHubMetricsCard';

const Dashboard = () => {
  const models = [
    {
      name: "RAPID",
      icon: <Zap size={20} className="text-blue-600" />,
      description: "Routing Application for Parallel computation of Discharge - River network routing model for large-scale hydrodynamic simulations",
      link: "/science-model-dashboard"
    },
    {
      name: "CMS-Flux",
      icon: <Wind size={20} className="text-green-600" />,
      description: "Carbon Monitoring System Flux - Atmospheric CO2 inversion system for quantifying carbon sources and sinks",
      link: "/science-model-dashboard/CMS-Flux"
    },
    {
      name: "ECCO",
      icon: <Waves size={20} className="text-teal-600" />,
      description: "Estimating the Circulation and Climate of the Ocean - Global ocean state estimation system combining models with observations",
      link: "/science-model-dashboard/ECCO"
    },
    {
      name: "ISSM",
      icon: <Mountain size={20} className="text-indigo-600" />,
      description: "Ice Sheet System Model - Thermomechanical ice sheet model for simulating ice dynamics and sea level change",
      link: "/science-model-dashboard/ISSM"
    },
    {
      name: "MOMO-CHEM",
      icon: <Atom size={20} className="text-purple-600" />,
      description: "Multi-scale Modeling of Atmospheric Chemistry - Chemical transport model for air quality and atmospheric composition studies",
      link: "/science-model-dashboard/MOMO-CHEM"
    },
    {
      name: "CARDAMOM",
      icon: <Leaf size={20} className="text-emerald-600" />,
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
              <span className="font-bold">SMD</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-blue-900">Science Model Dashboard</h1>
            </div>
          </div>
          
          <div className="flex gap-8">
            <a href="#" className="text-blue-600 border-b-2 border-blue-600 font-medium text-sm">Dashboard</a>
            <Link to="/RAPID" className="text-gray-600 hover:text-gray-800 font-medium text-sm">RAPID</Link>
            <Link to="/CMS-Flux" className="text-gray-600 hover:text-gray-800 font-medium text-sm">CMS-Flux</Link>
            <Link to="/ECCO" className="text-gray-600 hover:text-gray-800 font-medium text-sm">ECCO</Link>
            <Link to="/ISSM" className="text-gray-600 hover:text-gray-800 font-medium text-sm">ISSM</Link>
            <Link to="/MOMO-CHEM" className="text-gray-600 hover:text-gray-800 font-medium text-sm">MOMO-CHEM</Link>
            <Link to="/CARDAMOM" className="text-gray-600 hover:text-gray-800 font-medium text-sm">CARDAMOM</Link>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-500" />
              </div>
              <input type="text" placeholder="Search citations..." className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <button className="text-gray-600 hover:text-gray-800">
              <Bell size={20} />
            </button>
            <button className="text-gray-600 hover:text-gray-800">
              <Settings size={20} />
            </button>
            <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-700 font-semibold">
              A
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        
        {/* Model Overview Section */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Science Models Overview</h2>
            <p className="text-gray-600">
              Comprehensive suite of Earth system models for climate, hydrology, oceanography, and atmospheric research
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
        
        <PaperInfo />
        <Header />
        
        {/* Data Verification Section */}
        <div className="bg-white rounded-lg p-5 shadow-sm mb-6">
          <div className="text-lg font-semibold text-gray-800 mb-4">Verify & Explore the Data</div>
          <p className="text-sm text-gray-600 mb-4">
            This dashboard provides visualizations based on actual citation data. You can explore and verify the raw data using the following detailed views:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              to="/citations" 
              className="flex items-center p-4 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
            >
              <div className="mr-4 bg-blue-100 p-3 rounded-full">
                <Database size={24} className="text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-blue-900">Raw Citation Data</div>
                <div className="text-sm text-blue-700">View all papers</div>
              </div>
              <ExternalLink size={16} className="ml-auto text-blue-400" />
            </Link>
            
            <Link 
              to="/geographic-impact" 
              className="flex items-center p-4 bg-green-50 rounded-lg border border-green-100 hover:bg-green-100 transition-colors"
            >
              <div className="mr-4 bg-green-100 p-3 rounded-full">
                <Globe size={24} className="text-green-600" />
              </div>
              <div>
                <div className="font-medium text-green-900">Geographic Impact</div>
                <div className="text-sm text-green-700">Explore watersheds</div>
              </div>
              <ExternalLink size={16} className="ml-auto text-green-400" />
            </Link>
            
            <Link 
              to="/research-domains" 
              className="flex items-center p-4 bg-purple-50 rounded-lg border border-purple-100 hover:bg-purple-100 transition-colors"
            >
              <div className="mr-4 bg-purple-100 p-3 rounded-full">
                <BarChart3 size={24} className="text-purple-600" />
              </div>
              <div>
                <div className="font-medium text-purple-900">Research Domains</div>
                <div className="text-sm text-purple-700">Analyze topics and applications</div>
              </div>
              <ExternalLink size={16} className="ml-auto text-purple-400" />
            </Link>
          </div>
        </div>
        

        
        <MetricsOverview />
        <CitationTrendsChart />
        
        <div className="grid grid-cols-2 gap-6 mb-6">
          <ResearchDomainsCard />
          <EngagementLevelsCard />
        </div>
        
        <div className="grid grid-cols-2 gap-6 mb-6">
          <CitationTypeCard />
          <ModelComparisonChart />
        </div>
        
        <FutureTrendsChart />
        <DashboardSummaryCard />
        
        <div className="grid grid-cols-2 gap-6 mb-6">
          <JournalDistributionCard />
          <GitHubMetricsCard />
        </div>
        
        <Footer />
      </main>
    </div>
  );
};

export default Dashboard;
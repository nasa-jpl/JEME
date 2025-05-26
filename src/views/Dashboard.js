// src/views/Dashboard.js
// Main dashboard view that combines all components

import React from 'react';
import { Search, Bell, Settings, ExternalLink, Database, Globe, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

// Import components
import PaperInfo from '../components/PaperInfo';
import Header from '../components/Header';
import Footer from '../components/Footer';

// Import section components
import MetricsOverview from './sections/MetricsOverview';

// Import chart components
import CitationTrendsChart from '../components/charts/CitationTrendsChart';
import ModelComparisonChart from '../components/charts/ModelComparisonChart';
import ResearchDomainsCard from '../components/charts/ResearchDomainsCard';
import EngagementLevelsCard from '../components/charts/EngagementLevelsCard';
import CitationTypeCard from '../components/charts/CitationTypeCard';
import FutureTrendsChart from '../components/charts/FutureTrendsChart'; 
import DashboardSummaryCard from '../components/charts/DashboardSummaryCard';
import JournalDistributionCard from '../components/charts/JournalDistributionCard';
import GitHubMetricsCard from '../components/charts/GitHubMetricsCard';

const Dashboard = () => {
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
            <Link to="/citations" className="text-gray-600 hover:text-gray-800 font-medium text-sm">Citation Analytics</Link>
            <Link to="/geographic-impact" className="text-gray-600 hover:text-gray-800 font-medium text-sm">Geographic Impact</Link>
            <Link to="/research-domains" className="text-gray-600 hover:text-gray-800 font-medium text-sm">Research Domains</Link>
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
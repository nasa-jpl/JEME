// Generic Dashboard component that works with any model
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Award, TrendingUp, GitBranch, Droplet, ArrowRight, Download, RefreshCw, ExternalLink, Zap, Wind, Waves, Mountain, Atom, Leaf, ChevronDown, ChevronUp } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import { calculateMetrics, processCitationTrends } from '../utils/dataUtils';
import { getModelConfig } from '../config/modelConfig';

// Import chart components
import CitationTrendsChart from '../components/charts/CitationTrendsChart';
import EngagementLevelsCard from '../components/charts/EngagementLevelsCard';
import FutureTrendsChart from '../components/charts/FutureTrendsChart';
import GitHubMetricsCard from '../components/charts/GitHubMetricsCard';

const GenericDashboard = ({ modelName, citationsData }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [teamPapersExpanded, setTeamPapersExpanded] = useState(false);
  const modelConfig = getModelConfig(modelName);

  const models = [
    {
      name: "RAPID",
      icon: <Zap size={20} className="text-blue-600" />,
      description: "Routing Application for Parallel computation of Discharge - River network routing model for large-scale hydrodynamic simulations",
      link: "/science-model-dashboard/RAPID"
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

  // Sample team papers data - in a real implementation, this would come from the model config or data files
  const getTeamPapers = (modelName) => {
    const paperData = {
      'CMS-Flux': {
        title: "Atmospheric CO2 inversion model for carbon flux estimation",
        authors: "Sample Author 1, Sample Author 2, Sample Author 3, Sample Author 4, Sample Author 5, Sample Author 6",
        journal: "Geophysical Research Letters (2020), Volume 47, Issue 12, Pages e2020GL087923",
        doi: "10.1029/2020GL087923"
      },
      'RAPID': {
        title: "River network routing on the NHDPlus dataset",
        authors: "Cédric H. David, David R. Maidment, Guo-Yue Niu, Zong-Liang Yang, Florence Habets, Victor Eijkhout",
        journal: "Journal of Hydrometeorology (2011), Volume 12, Issue 5, Pages 913-934",
        doi: "10.1175/2011JHM1345.1"
      },
      'ECCO': {
        title: "ECCO version 4: an integrated framework for non-linear inverse modeling",
        authors: "Sample ECCO Author 1, Sample ECCO Author 2, Sample ECCO Author 3",
        journal: "Geoscientific Model Development (2017), Volume 10, Pages 3205-3220",
        doi: "10.5194/gmd-10-3205-2017"
      },
      'ISSM': {
        title: "Ice-sheet model sensitivities to environmental forcing",
        authors: "Sample ISSM Author 1, Sample ISSM Author 2, Sample ISSM Author 3",
        journal: "Journal of Glaciology (2018), Volume 64, Issue 247, Pages 761-777",
        doi: "10.1017/jog.2018.65"
      },
      'MOMO-CHEM': {
        title: "Multi-model multi-constituent chemical data assimilation",
        authors: "Sample MOMO Author 1, Sample MOMO Author 2, Sample MOMO Author 3",
        journal: "Atmospheric Chemistry and Physics (2020), Volume 20, Pages 931-967",
        doi: "10.5194/acp-20-931-2020"
      },
      'CARDAMOM': {
        title: "CARDAMOM: A flexible data assimilation system for carbon cycle science",
        authors: "Sample CARDAMOM Author 1, Sample CARDAMOM Author 2, Sample CARDAMOM Author 3",
        journal: "Geoscientific Model Development (2019), Volume 12, Pages 807-852",
        doi: "10.5194/gmd-12-807-2019"
      }
    };
    return paperData[modelName] || paperData['CMS-Flux'];
  };

  const teamPaper = getTeamPapers(modelName);

  // Calculate metrics from the JSON data
  const metrics = useMemo(() => {
    if (!citationsData || citationsData.length === 0) {
      return {
        totalPapers: 0,
        totalCitations: 0,
        avgCitations: 0,
        growthRate: 0
      };
    }

    return calculateMetrics(citationsData);
  }, [citationsData]);

  // Process citation trends
  const citationTrends = useMemo(() => {
    if (!citationsData || citationsData.length === 0) return [];
    return processCitationTrends(citationsData);
  }, [citationsData]);

  const handleRefresh = () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 1000);
  };

  if (!modelConfig) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">Model Not Found</h1>
            <p className="text-gray-600 mt-2">The model "{modelName}" is not configured.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
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
            <Link to="/science-model-dashboard" className="text-gray-600 hover:text-gray-800 font-medium text-sm">Dashboard</Link>
            <Link to="/science-model-dashboard/RAPID" className={`font-medium text-sm ${modelName === 'RAPID' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'}`}>RAPID</Link>
            <Link to="/science-model-dashboard/CMS-Flux" className={`font-medium text-sm ${modelName === 'CMS-Flux' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'}`}>CMS-Flux</Link>
            <Link to="/science-model-dashboard/ECCO" className={`font-medium text-sm ${modelName === 'ECCO' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'}`}>ECCO</Link>
            <Link to="/science-model-dashboard/ISSM" className={`font-medium text-sm ${modelName === 'ISSM' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'}`}>ISSM</Link>
            <Link to="/science-model-dashboard/MOMO-CHEM" className={`font-medium text-sm ${modelName === 'MOMO-CHEM' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'}`}>MOMO-CHEM</Link>
            <Link to="/science-model-dashboard/CARDAMOM" className={`font-medium text-sm ${modelName === 'CARDAMOM' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'}`}>CARDAMOM</Link>
            <Link to="/science-model-dashboard/how-it-works" className="text-gray-600 hover:text-gray-800 font-medium text-sm">How It Works</Link>
          </div>
          
          <div className="flex items-center gap-4">
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        
        {/* Science Models Overview Section */}
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
                className={`group p-4 border rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 ${
                  model.name === modelName ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg transition-colors ${
                    model.name === modelName ? 'bg-blue-100' : 'bg-gray-50 group-hover:bg-blue-50'
                  }`}>
                    {model.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold transition-colors ${
                      model.name === modelName ? 'text-blue-900' : 'text-gray-900 group-hover:text-blue-900'
                    }`}>
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
        
        {/* Team Papers Section */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{modelConfig.displayName} Core Team Paper</h2>
              <p className="text-sm text-gray-600">Main research publication for this model</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
          
          <div className="border-l-4 border-blue-500 pl-4 py-2">
            <h3 className="text-lg font-medium text-gray-900 mb-2">{teamPaper.title}</h3>
            <p className="text-gray-700 mb-2">{teamPaper.authors}</p>
            <p className="text-gray-600 text-sm mb-2">{teamPaper.journal}</p>
            <p className="text-blue-600 text-sm">DOI: {teamPaper.doi}</p>
          </div>
          
          <div className="mt-4">
            <button
              onClick={() => setTeamPapersExpanded(!teamPapersExpanded)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              {teamPapersExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              View All Team Papers
            </button>
            
            {teamPapersExpanded && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-600 text-sm">
                  Additional team papers for {modelConfig.displayName} would be listed here. 
                  This section can be populated with more publications from the research team.
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Papers"
            value={metrics.totalPapers.toLocaleString()}
            icon={<Award className="w-6 h-6" />}
            iconBg="bg-blue-500"
            trend={null}
            trendUp={true}
            breakdown={[]}
          />
          <MetricCard
            title="Total Citations"
            value={metrics.totalCitations.toLocaleString()}
            icon={<TrendingUp className="w-6 h-6" />}
            iconBg="bg-green-500"
            trend={null}
            trendUp={true}
            breakdown={[]}
          />
          <MetricCard
            title="Average Citations"
            value={metrics.avgCitations.toString()}
            icon={<GitBranch className="w-6 h-6" />}
            iconBg="bg-purple-500"
            trend={null}
            trendUp={true}
            breakdown={[]}
          />
          <MetricCard
            title="Growth Rate"
            value={`${metrics.growthRate}%`}
            icon={<Droplet className="w-6 h-6" />}
            iconBg="bg-orange-500"
            trend={`${Math.abs(metrics.growthRate)}% ${metrics.growthRate >= 0 ? 'increase' : 'decrease'}`}
            trendUp={metrics.growthRate >= 0}
            breakdown={[]}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Citation Trends Chart */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Citation Trends</h3>
              <p className="text-sm text-gray-600">Publications and citations over time</p>
            </div>
            <div className="p-6">
              <CitationTrendsChart data={citationsData} />
            </div>
          </div>

          {/* Engagement Levels */}
          <EngagementLevelsCard data={citationsData} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Future Trends */}
          <FutureTrendsChart data={citationsData} />
          
          {/* GitHub Metrics */}
          {modelConfig.github ? (
            <GitHubMetricsCard 
              owner={modelConfig.github.split('/')[3]} 
              repo={modelConfig.github.split('/')[4]} 
            />
          ) : (
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">GitHub Repository</h3>
                <p className="text-gray-500 text-sm">No dedicated GitHub repository available</p>
                <p className="text-gray-400 text-xs mt-2">
                  Visit the project website for more information
                </p>
                {modelConfig.website && (
                  <a 
                    href={modelConfig.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center mt-3 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Visit Website
                    <ExternalLink className="ml-1 w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Navigation */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Explore {modelConfig.displayName} Data</h3>
            <p className="text-sm text-gray-600">Dive deeper into specific aspects of {modelConfig.displayName} research</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                to={`/science-model-dashboard/${modelName}/citations`}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div>
                  <h4 className="font-medium text-gray-900">Citations Analysis</h4>
                  <p className="text-sm text-gray-600">Detailed citation patterns and trends</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </Link>
              
              <Link
                to={`/science-model-dashboard/${modelName}/geographic-impact`}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div>
                  <h4 className="font-medium text-gray-900">Geographic Impact</h4>
                  <p className="text-sm text-gray-600">Global distribution and regional analysis</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </Link>
              
              <Link
                to={`/science-model-dashboard/${modelName}/research-domains`}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div>
                  <h4 className="font-medium text-gray-900">Research Domains</h4>
                  <p className="text-sm text-gray-600">Scientific fields and applications</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GenericDashboard;
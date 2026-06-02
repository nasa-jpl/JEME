// Generic Dashboard component that works with any model
import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Award, TrendingUp, GitBranch, Droplet, ArrowRight, Download, RefreshCw, ExternalLink, Zap, Wind, Waves, Mountain, Atom, Leaf, ChevronDown, ChevronUp, CloudLightning, Layers, ShieldCheck, FlaskConical, Globe } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import MetricCard from '../components/MetricCard';
import { calculateMetrics, processCitationTrends } from '../utils/dataUtils';
import { getModelConfig } from '../config/modelConfig';

// Import chart components
import CitationTrendsChart from '../components/charts/CitationTrendsChart';
import EngagementLevelsCard from '../components/charts/EngagementLevelsCard';
import FutureTrendsChart from '../components/charts/FutureTrendsChart';
import GitHubMetricsCard from '../components/charts/GitHubMetricsCard';
import MissionsSummary from '../components/MissionsSummary';
import UncertaintyOverviewCard from '../components/charts/UncertaintyOverviewCard';
import UncertaintyMatrixCard from '../components/charts/UncertaintyMatrixCard';
import EarthSystemSection from '../components/EarthSystemSection';

const GenericDashboard = ({ modelName, citationsData }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [activeType, setActiveType] = useState(null);
  const [teamPapersExpanded, setTeamPapersExpanded] = useState(false);
  const [modelInfoExpanded, setModelInfoExpanded] = useState(false);
  const [modelInfo, setModelInfo] = useState(null);
  const modelConfig = getModelConfig(modelName);

  // Fetch model info from markdown file
  useEffect(() => {
    const fetchModelInfo = async () => {
      try {
        const response = await fetch(`/models/${modelName}.md`);
        if (response.ok) {
          const text = await response.text();
          // Parse markdown sections
          const sections = {};
          const lines = text.split('\n');
          let currentSection = null;
          let currentContent = [];

          lines.forEach(line => {
            if (line.startsWith('## ')) {
              if (currentSection) {
                sections[currentSection] = currentContent.join('\n').trim();
              }
              currentSection = line.replace('## ', '').trim();
              currentContent = [];
            } else if (line.startsWith('# ')) {
              sections.title = line.replace('# ', '').trim();
            } else if (currentSection) {
              currentContent.push(line);
            }
          });

          if (currentSection) {
            sections[currentSection] = currentContent.join('\n').trim();
          }

          setModelInfo(sections);
        }
      } catch (error) {
        console.error('Failed to fetch model info:', error);
      }
    };

    if (modelName) {
      fetchModelInfo();
    }
  }, [modelName]);

  const models = [
    {
      name: "RAPID",
      icon: <Zap size={20} className="text-blue-600" />,
      description: "Routing Application for Parallel computation of Discharge - River network routing model for large-scale hydrodynamic simulations",
      link: "/RAPID"
    },
    {
      name: "CMS-Flux",
      icon: <Wind size={20} className="text-green-600" />,
      description: "Carbon Monitoring System Flux - Atmospheric CO2 inversion system for quantifying carbon sources and sinks",
      link: "/CMS-Flux"
    },
    {
      name: "ECCO",
      icon: <Waves size={20} className="text-teal-600" />,
      description: "Estimating the Circulation and Climate of the Ocean - Global ocean state estimation system combining models with observations",
      link: "/ECCO"
    },
    {
      name: "ISSM",
      icon: <Mountain size={20} className="text-indigo-600" />,
      description: "Ice Sheet System Model - Thermomechanical ice sheet model for simulating ice dynamics and sea level change",
      link: "/ISSM"
    },
    {
      name: "MOMO-CHEM",
      icon: <Atom size={20} className="text-purple-600" />,
      description: "Multi-scale Modeling of Atmospheric Chemistry - Chemical transport model for air quality and atmospheric composition studies",
      link: "/MOMO-CHEM"
    },
    {
      name: "CARDAMOM",
      icon: <Leaf size={20} className="text-emerald-600" />,
      description: "Carbon Data Model Framework - Terrestrial carbon cycle data assimilation system for ecosystem carbon stock estimation",
      link: "/CARDAMOM"
    },
    {
      name: "LES",
      icon: <CloudLightning size={20} className="text-teal-600" />,
      description: "Large Eddy Simulation for Atmospheric Studies - High-resolution atmospheric modeling and boundary layer studies",
      link: "/LES"
    },
    {
      name: "EDMF",
      icon: <Layers size={20} className="text-orange-600" />,
      description: "Eddy Diffusivity Mass Flux Scheme - Parameterization scheme for turbulent mixing and convective transport in atmospheric models",
      link: "/EDMF"
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
      },
      'LES': {
        title: "Large-Eddy Simulation of Atmospheric Boundary Layer Processes",
        authors: "LES Research Team Authors",
        journal: "Journal of Atmospheric Sciences (2023), Volume 80, Issue 3, Pages 789-812",
        doi: "10.1175/JAS-D-22-0123.1"
      },
      'EDMF': {
        title: "Eddy Diffusivity Mass Flux Parameterization for Atmospheric Models",
        authors: "EDMF Research Team Authors",
        journal: "Monthly Weather Review (2023), Volume 151, Issue 8, Pages 2134-2156",
        doi: "10.1175/MWR-D-22-0245.1"
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
              <h1 className="text-lg font-semibold text-blue-900">JEME Dashboard</h1>
              <p className="text-sm text-gray-600">JPL's Earth Modeling Enterprise</p>
            </div>
          </div>
          
          <div className="flex gap-8">
            <Link to="/" className="text-gray-600 hover:text-gray-800 font-medium text-sm">Dashboard</Link>
            <Link to="/RAPID" className={`font-medium text-sm ${modelName === 'RAPID' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'}`}>RAPID</Link>
            <Link to="/CMS-Flux" className={`font-medium text-sm ${modelName === 'CMS-Flux' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'}`}>CMS-Flux</Link>
            <Link to="/ECCO" className={`font-medium text-sm ${modelName === 'ECCO' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'}`}>ECCO</Link>
            <Link to="/ISSM" className={`font-medium text-sm ${modelName === 'ISSM' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'}`}>ISSM</Link>
            <Link to="/MOMO-CHEM" className={`font-medium text-sm ${modelName === 'MOMO-CHEM' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'}`}>MOMO-CHEM</Link>
            <Link to="/CARDAMOM" className={`font-medium text-sm ${modelName === 'CARDAMOM' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'}`}>CARDAMOM</Link>
            <Link to="/LES" className={`font-medium text-sm ${modelName === 'LES' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'}`}>LES</Link>
            <Link to="/EDMF" className={`font-medium text-sm ${modelName === 'EDMF' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'}`}>EDMF</Link>
            <Link to="/how-it-works" className="text-gray-600 hover:text-gray-800 font-medium text-sm">How It Works</Link>
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

        {/* Model Information Section */}
        {modelInfo && (
          <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">About {modelConfig.displayName}</h2>
              <p className="text-sm text-gray-600">Learn more about this model</p>
            </div>

            {/* Overview preview - show first 2-3 lines */}
            <div className="text-gray-700 space-y-2">
              {modelInfo.Overview && (
                <div>
                  <p className="leading-relaxed">
                    {modelInfoExpanded
                      ? modelInfo.Overview
                      : modelInfo.Overview.split('\n').slice(0, 2).join('\n') + (modelInfo.Overview.split('\n').length > 2 ? '...' : '')}
                  </p>
                </div>
              )}
            </div>

            {/* Expanded content */}
            {modelInfoExpanded && modelInfo && (
              <div className="mt-4 space-y-4 text-gray-700">
                {modelInfo.Background && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Background</h3>
                    <p className="leading-relaxed whitespace-pre-line">{modelInfo.Background}</p>
                  </div>
                )}

                {modelInfo['Key Features'] && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Key Features</h3>
                    <div className="leading-relaxed whitespace-pre-line">{modelInfo['Key Features']}</div>
                  </div>
                )}

                {modelInfo['Scientific Applications'] && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Scientific Applications</h3>
                    <div className="leading-relaxed whitespace-pre-line">{modelInfo['Scientific Applications']}</div>
                  </div>
                )}

                {modelInfo['Technical Details'] && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Technical Details</h3>
                    <div className="leading-relaxed whitespace-pre-line">{modelInfo['Technical Details']}</div>
                  </div>
                )}

                {(modelInfo['Team Members'] || modelInfo['JPL Team Members']) && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">{modelInfo['Team Members'] ? 'Team Members' : 'JPL Team Members'}</h3>
                    <div className="leading-relaxed whitespace-pre-line">{modelInfo['Team Members'] || modelInfo['JPL Team Members']}</div>
                  </div>
                )}

                {modelInfo.Resources && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Resources</h3>
                    <div className="leading-relaxed whitespace-pre-line">{modelInfo.Resources}</div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4">
              <button
                onClick={() => setModelInfoExpanded(!modelInfoExpanded)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
              >
                {modelInfoExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {modelInfoExpanded ? 'Show Less' : 'Learn More'}
              </button>
            </div>
          </div>
        )}

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

        {/* Earth System Spheres */}
        <EarthSystemSection modelName={modelName} citationsData={citationsData} />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Citation Trends Chart */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Citation Trends</h3>
              <p className="text-sm text-gray-600">Number of papers citing this model published each year, showing research adoption over time</p>
            </div>
            <div className="p-6">
              <CitationTrendsChart data={citationsData} />
            </div>
          </div>

          {/* Engagement Levels */}
          <EngagementLevelsCard data={citationsData} />
        </div>

        {/* Missions & Instruments */}
        <div className="mb-8">
          <MissionsSummary citationsData={citationsData} maxMissions={8} showDetails={true} />
        </div>

        {/* Future Trends + Paper Type Classification */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <FutureTrendsChart data={citationsData} />

          {/* Paper Type Classification */}
          {citationsData && citationsData.some(c => c.paper_type) && (() => {
            const sciencePapers = citationsData.filter(c => c.paper_type === 'science');
            const algorithmPapers = citationsData.filter(c => c.paper_type === 'algorithm');
            const untyped = citationsData.filter(c => !c.paper_type);
            const pieData = [
              { name: 'Science', value: sciencePapers.length, color: '#10B981' },
              { name: 'Algorithm', value: algorithmPapers.length, color: '#3B82F6' },
              ...(untyped.length > 0 ? [{ name: 'Unclassified', value: untyped.length, color: '#D1D5DB' }] : [])
            ].filter(d => d.value > 0);
            const shownPapers = activeType === 'Science' ? sciencePapers : activeType === 'Algorithm' ? algorithmPapers : [];
            return (
              <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col">
                <div className="text-lg font-semibold text-gray-800 mb-1">Paper Type Classification</div>
                <div className="text-sm text-gray-500 mb-4">Click a segment to browse papers of that type</div>
                <div className="flex gap-4 flex-1">
                  {/* Pie + legend */}
                  <div className="flex flex-col items-center w-44 flex-shrink-0">
                    <div className="h-44 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                            paddingAngle={2} dataKey="value"
                            onClick={(entry) => setActiveType(prev => prev === entry.name ? null : entry.name)}>
                            {pieData.map((entry, i) => (
                              <Cell key={i} fill={entry.color}
                                stroke={activeType === entry.name ? '#1F2937' : '#fff'}
                                strokeWidth={activeType === entry.name ? 2 : 1}
                                style={{ cursor: 'pointer', opacity: activeType && activeType !== entry.name ? 0.5 : 1 }} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v, n) => [v + ' papers', n]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-col gap-1 w-full mt-1">
                      {pieData.map((d, i) => (
                        <button key={i}
                          onClick={() => setActiveType(prev => prev === d.name ? null : d.name)}
                          className={`flex items-center gap-2 px-2 py-1 rounded-lg text-sm text-left transition-colors ${activeType === d.name ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50'}`}>
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                          <span className="text-gray-700 flex-1">{d.name}</span>
                          <span className="text-gray-500 text-xs">{d.value}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Paper list */}
                  <div className="flex-1 min-w-0">
                    {activeType ? (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          {activeType === 'Science'
                            ? <Globe size={14} className="text-emerald-600" />
                            : <FlaskConical size={14} className="text-blue-600" />}
                          <span className="text-sm font-semibold text-gray-700">{activeType} Papers</span>
                          <span className="text-xs text-gray-400">({shownPapers.length})</span>
                        </div>
                        <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-lg">
                          {shownPapers.map((p, i) => {
                            const doi = p.doi || p.DOI;
                            const link = doi ? `https://doi.org/${doi}` : (p.url || p.URL || null);
                            const title = Array.isArray(p.title) ? p.title[0] : (p.title || 'Untitled');
                            return (
                              <div key={i} className="px-3 py-2 hover:bg-gray-50">
                                <div className="flex items-start gap-1">
                                  {link ? (
                                    <a href={link} target="_blank" rel="noopener noreferrer"
                                      className="text-xs font-medium text-blue-700 hover:underline flex-1 leading-relaxed">
                                      {title}
                                    </a>
                                  ) : (
                                    <span className="text-xs font-medium text-gray-700 flex-1 leading-relaxed">{title}</span>
                                  )}
                                  {link && <ExternalLink size={10} className="mt-0.5 flex-shrink-0 text-gray-400" />}
                                </div>
                                {p.paper_type_rationale && (
                                  <p className="text-xs text-gray-400 mt-0.5 italic leading-snug line-clamp-2">{p.paper_type_rationale}</p>
                                )}
                                <div className="flex gap-3 mt-0.5 text-xs text-gray-400">
                                  {p.year && <span>{p.year}</span>}
                                  {(p.citation_count || p['is-referenced-by-count']) > 0 && <span>{p.citation_count || p['is-referenced-by-count']} citations</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full text-sm text-gray-400 text-center">
                        Click a type to see its papers
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        <div className="mb-8">
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Link
                to={`/${modelName}/citations`}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div>
                  <h4 className="font-medium text-gray-900">Citations Analysis</h4>
                  <p className="text-sm text-gray-600">Detailed citation patterns and trends</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </Link>
              
              <Link
                to={`/${modelName}/geographic-impact`}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div>
                  <h4 className="font-medium text-gray-900">Geographic Impact</h4>
                  <p className="text-sm text-gray-600">Global distribution and regional analysis</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </Link>
              
              <Link
                to={`/${modelName}/research-domains`}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div>
                  <h4 className="font-medium text-gray-900">Research Domains</h4>
                  <p className="text-sm text-gray-600">Scientific fields and applications</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </Link>

              <Link
                to={`/${modelName}/uncertainty`}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <h4 className="font-medium text-gray-900">Uncertainty Analysis</h4>
                  </div>
                  <p className="text-sm text-gray-600">Classification confidence and data quality</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </Link>
            </div>
          </div>
        </div>

        {/* Uncertainty Analysis */}
        {citationsData && citationsData.length > 0 && citationsData[0]?.uncertainty && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            <UncertaintyOverviewCard data={citationsData} />
            <UncertaintyMatrixCard data={citationsData} />
          </div>
        )}
      </main>
    </div>
  );
};

export default GenericDashboard;
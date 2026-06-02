// TROPESS Mission Dashboard
import React, { useState, useEffect } from 'react';
import { ExternalLink, Database, Globe, BarChart3, ShieldCheck, Satellite, FlaskConical } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import NavBar from '../../components/NavBar';

// Import components
import PaperInfo from '../../components/PaperInfo';
import ModelInfoSection from '../../components/ModelInfoSection';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

// Import section components
import MetricsOverview from '../sections/MetricsOverview';

// Import chart components
import CitationTrendsChart from '../../components/charts/CitationTrendsChart';
import ResearchDomainsCard from '../../components/charts/ResearchDomainsCard';
import EngagementLevelsCard from '../../components/charts/EngagementLevelsCard';
import FutureTrendsChart from '../../components/charts/FutureTrendsChart';
import DashboardSummaryCard from '../../components/charts/DashboardSummaryCard';
import JournalDistributionCard from '../../components/charts/JournalDistributionCard';
import MissionsSummary from '../../components/MissionsSummary';
import UncertaintyOverviewCard from '../../components/charts/UncertaintyOverviewCard';
import UncertaintyMatrixCard from '../../components/charts/UncertaintyMatrixCard';

const TROPESSDashboard = () => {
  const [tropessData, setTropessData] = useState([]);
  const [activeType, setActiveType] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { loadModelData } = await import('../../utils/dataLoader');
        const data = await loadModelData('TROPESS');
        setTropessData(data);
      } catch (error) {
        console.error('Failed to load TROPESS data:', error);
      }
    };
    loadData();
  }, []);

  const missions = [
    {
      name: "GRACE",
      icon: <Satellite size={20} style={{ color: '#D946EF' }} />,
      description: "Gravity Recovery and Climate Experiment - Tracking changes in Earth's gravity field to monitor water storage, ice mass, and sea level",
      link: "/GRACE"
    },
    {
      name: "SWOT",
      icon: <Satellite size={20} style={{ color: '#F59E0B' }} />,
      description: "Surface Water and Ocean Topography - Ka-band radar interferometry for water surface elevation measurements",
      link: "/SWOT"
    },
    {
      name: "TROPESS",
      icon: <Satellite size={20} style={{ color: '#0EA5E9' }} />,
      description: "TROPospheric Emission Spectrometer System - Multi-instrument retrievals of CO, CH4, NH3, O3, PAN, HDO/H2O from CrIS and AIRS via the MUSES algorithm",
      link: "/TROPESS"
    }
  ];

  return (
    <div className="bg-gray-100 min-h-screen">
      <NavBar activeItem="TROPESS" />

      <main className="max-w-7xl mx-auto px-4 py-6">

        {/* JEOE Missions Section */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">JEOE Missions</h2>
            <p className="text-gray-600">
              NASA Earth observation missions tracked by the JPL Earth Observation Enterprise
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {missions.map((mission, index) => (
              <Link
                key={index}
                to={mission.link}
                className={`group p-4 border rounded-lg hover:border-sky-300 hover:shadow-md transition-all duration-200 ${
                  mission.name === 'TROPESS' ? 'border-sky-300 bg-sky-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg transition-colors ${
                    mission.name === 'TROPESS' ? 'bg-sky-100' : 'bg-gray-50 group-hover:bg-sky-50'
                  }`}>
                    {mission.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold transition-colors ${
                      mission.name === 'TROPESS' ? 'text-sky-900' : 'text-gray-900 group-hover:text-sky-900'
                    }`}>
                      {mission.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                      {mission.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

        </div>

        <ModelInfoSection modelName="TROPESS" modelDisplayName="TROPESS" />
        <PaperInfo modelName="TROPESS" />
        <Header modelName="TROPESS" />

        {/* Data Verification Section */}
        <div className="bg-white rounded-lg p-5 shadow-sm mb-6">
          <div className="text-lg font-semibold text-gray-800 mb-4">Verify & Explore the Data</div>
          <p className="text-sm text-gray-600 mb-4">
            This dashboard provides visualizations based on actual publication data. You can explore and verify the raw data using the following detailed views:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/TROPESS/citations"
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
              to="/TROPESS/geographic-impact"
              className="flex items-center p-4 bg-green-50 rounded-lg border border-green-100 hover:bg-green-100 transition-colors"
            >
              <div className="mr-4 bg-green-100 p-3 rounded-full">
                <Globe size={24} className="text-green-600" />
              </div>
              <div>
                <div className="font-medium text-green-900">Geographic Impact</div>
                <div className="text-sm text-green-700">Explore regions</div>
              </div>
              <ExternalLink size={16} className="ml-auto text-green-400" />
            </Link>

            <Link
              to="/TROPESS/research-domains"
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

            <Link
              to="/TROPESS/uncertainty"
              className="flex items-center p-4 bg-amber-50 rounded-lg border border-amber-100 hover:bg-amber-100 transition-colors"
            >
              <div className="mr-4 bg-amber-100 p-3 rounded-full">
                <ShieldCheck size={24} className="text-amber-600" />
              </div>
              <div>
                <div className="font-medium text-amber-900">Uncertainty Analysis</div>
                <div className="text-sm text-amber-700">Classification confidence</div>
              </div>
              <ExternalLink size={16} className="ml-auto text-amber-400" />
            </Link>
          </div>
        </div>

        <MetricsOverview data={tropessData} />
        <CitationTrendsChart data={tropessData} />

        <div className="grid grid-cols-2 gap-6 mb-6">
          <ResearchDomainsCard data={tropessData} />
          <EngagementLevelsCard data={tropessData} />
        </div>

        {/* Future Trends + Paper Type Classification */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <FutureTrendsChart data={tropessData} />

          {tropessData.some(c => c.paper_type) && (() => {
            const sciencePapers = tropessData.filter(c => c.paper_type === 'science');
            const algorithmPapers = tropessData.filter(c => c.paper_type === 'algorithm');
            const untyped = tropessData.filter(c => !c.paper_type);
            const pieData = [
              { name: 'Science', value: sciencePapers.length, color: '#10B981' },
              { name: 'Algorithm', value: algorithmPapers.length, color: '#3B82F6' },
              ...(untyped.length > 0 ? [{ name: 'Unclassified', value: untyped.length, color: '#D1D5DB' }] : [])
            ].filter(d => d.value > 0);
            const shownPapers = activeType === 'Science' ? sciencePapers : activeType === 'Algorithm' ? algorithmPapers : activeType === 'Unclassified' ? untyped : [];
            return (
              <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col">
                <div className="text-lg font-semibold text-gray-800 mb-1">Paper Type Classification</div>
                <div className="text-sm text-gray-500 mb-4">Click a segment to browse papers of that type</div>
                <div className="flex gap-4 flex-1">
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
                      <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm gap-2 pt-8">
                        <FlaskConical size={28} className="text-gray-300" />
                        <span>Click a slice to see papers</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        <div className="mb-6">
          <MissionsSummary citationsData={tropessData} maxMissions={8} showDetails={true} />
        </div>

        <DashboardSummaryCard data={tropessData} />

        <div className="grid grid-cols-1 gap-6 mb-6">
          <JournalDistributionCard data={tropessData} />
        </div>

        {tropessData.length > 0 && tropessData[0]?.uncertainty && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <UncertaintyOverviewCard data={tropessData} />
            <UncertaintyMatrixCard data={tropessData} />
          </div>
        )}

        <Footer isJEOE />
      </main>
    </div>
  );
};

export default TROPESSDashboard;

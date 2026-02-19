import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

import { loadModelData } from '../../utils/dataLoader';

// Define consistent colors for domains (moved outside component for better accessibility) - Same order as RAPID
const domainColors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4', '#F97316', '#EC4899'];

const MOMOCHEMResearchDomainsPage = () => {
  const [citationsData, setCitationsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [processedData, setProcessedData] = useState({
    domainStats: {},
    yearlyData: {},
    papers: [],
    domains: []
  });

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await loadModelData('MOMO-CHEM');
        setCitationsData(data);
      } catch (error) {
        console.error('Error loading MOMO-CHEM data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Process the JSON data when citationsData changes or domain filter changes
  useEffect(() => {
    if (citationsData.length === 0) return;

    const processData = () => {
      // Extract unique research domains
      const domains = [...new Set(citationsData
        .map(paper => paper.research_domain)
        .filter(domain => domain && domain !== "Unknown")
      )];

      // Count papers by domain
      const domainStats = {};
      domains.forEach(domain => {
        domainStats[domain] = citationsData.filter(paper =>
          paper.research_domain === domain
        ).length;
      });

      // Group papers by year - FIXED: Filter by selected domain first
      const yearlyData = {};
      const filteredDataForYear = selectedDomain === 'all'
        ? citationsData
        : citationsData.filter(paper => paper.research_domain === selectedDomain);

      filteredDataForYear.forEach(paper => {
        // Extract year from multiple possible sources
        let year = null;
        if (paper.year) {
          year = paper.year;
        } else if (paper.published && paper.published['date-parts'] && paper.published['date-parts'][0]) {
          year = paper.published['date-parts'][0][0];
        } else if (paper['published-online'] && paper['published-online']['date-parts'] && paper['published-online']['date-parts'][0]) {
          year = paper['published-online']['date-parts'][0][0];
        } else if (paper['published-print'] && paper['published-print']['date-parts'] && paper['published-print']['date-parts'][0]) {
          year = paper['published-print']['date-parts'][0][0];
        }

        if (year && year > 2000) {
          if (!yearlyData[year]) yearlyData[year] = 0;
          yearlyData[year]++;
        }
      });

      // Filter papers for display
      const filteredPapers = selectedDomain === 'all'
        ? citationsData.slice(0, 50) // Show first 50 papers
        : citationsData.filter(paper => paper.research_domain === selectedDomain).slice(0, 50);

      setProcessedData({
        domainStats,
        yearlyData,
        papers: filteredPapers,
        domains
      });
    };

    processData();
  }, [selectedDomain, citationsData]);

  // Calculate engagement level stats
  const engagementStats = React.useMemo(() => {
    const stats = {};
    citationsData.forEach(paper => {
      const level = paper.engagement_level || "Unknown";
      if (!stats[level]) stats[level] = 0;
      stats[level]++;
    });
    return stats;
  }, [citationsData]);

  // Top research domains by paper count
  const topDomains = React.useMemo(() => {
    return Object.entries(processedData.domainStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([domain, count]) => ({ domain, count }));
  }, [processedData.domainStats]);

  // Yearly publication data - FIXED: Now uses filtered data
  const yearData = React.useMemo(() => {
    return Object.keys(processedData.yearlyData)
      .sort()
      .map(year => ({ 
        year, 
        count: processedData.yearlyData[year] 
      }))
      .slice(-10); // Last 10 years
  }, [processedData.yearlyData]);

  const getDomainColor = (domain) => {
    const colors = {
      "Ocean Biogeochemistry": "bg-purple-100 text-purple-800",
      "Marine Ecosystems": "bg-violet-100 text-violet-800",
      "Climate Science": "bg-cyan-100 text-cyan-800",
      "Ocean Modeling": "bg-blue-100 text-blue-800",
      "Biogeochemical Cycles": "bg-purple-100 text-purple-800",
      "Marine Chemistry": "bg-indigo-100 text-indigo-800",
      "Ecosystem Dynamics": "bg-violet-100 text-violet-800",
      "Environmental Science": "bg-emerald-100 text-emerald-800",
      "Marine Biology": "bg-purple-100 text-purple-800"
    };
    return colors[domain] || "bg-gray-100 text-gray-800";
  };

  // Helper function to extract year from paper
  const extractYear = (paper) => {
    if (paper.year) return paper.year;
    if (paper.published && paper.published['date-parts'] && paper.published['date-parts'][0]) {
      return paper.published['date-parts'][0][0];
    }
    if (paper['published-online'] && paper['published-online']['date-parts'] && paper['published-online']['date-parts'][0]) {
      return paper['published-online']['date-parts'][0][0];
    }
    if (paper['published-print'] && paper['published-print']['date-parts'] && paper['published-print']['date-parts'][0]) {
      return paper['published-print']['date-parts'][0][0];
    }
    return null;
  };

  // Helper function to extract citations count
  const extractCitations = (paper) => {
    return paper['is-referenced-by-count'] || paper.cites || paper.citations || 0;
  };

  // Helper function to extract publisher/source
  const extractSource = (paper) => {
    if (paper['container-title'] && Array.isArray(paper['container-title']) && paper['container-title'][0]) {
      return paper['container-title'][0];
    }
    if (paper.source) return paper.source;
    if (paper.publisher) return paper.publisher;
    return "Unknown Source";
  };

  // Helper function to extract DOI
  const extractDOI = (paper) => {
    return paper.DOI || paper.doi || null;
  };

  // Export function
  const exportData = () => {
    const csvContent = [
      ['Domain', 'Papers', 'Percentage', 'Engagement Level Distribution'].join(','),
      ...topDomains.map(domain => [
        `"${domain.domain}"`,
        domain.count,
        ((domain.count / citationsData.length) * 100).toFixed(1) + '%',
        `"${Object.entries(engagementStats).map(([level, count]) => `${level}: ${count}`).join('; ')}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'momo_chem_research_domains_analysis.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading research domains data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center">
            <Link to="/science-model-dashboard/MOMO-CHEM" className="flex items-center text-blue-600 hover:text-blue-800 mr-6">
              <ArrowLeft size={18} className="mr-1" />
              <span className="font-medium">Back to MOMO-CHEM Dashboard</span>
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">MOMO-CHEM Research Domains Analysis</h1>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Summary Card */}
          <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-3">
            <div className="flex flex-wrap items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Research Domain Analysis</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Analysis of {citationsData.length} research papers using MOMO-CHEM across different domains
                </p>
              </div>
              <div className="flex items-center space-x-4 mt-2 sm:mt-0">
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Filter size={16} className="text-gray-400" />
                  </div>
                  <select
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value)}
                    className="appearance-none pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="all">All Domains</option>
                    {processedData.domains.map((domain) => (
                      <option key={domain} value={domain}>{domain}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                <button 
                  onClick={exportData}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  <Download size={16} />
                  <span>Export Analysis</span>
                </button>
              </div>
            </div>
            
            <div className="flex flex-wrap text-center mb-6">
              <div className="w-full sm:w-1/2 lg:w-1/5 p-3">
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-purple-700 mb-1">{processedData.domains.length}</div>
                  <div className="text-sm text-purple-600">Research Domains</div>
                </div>
              </div>
              <div className="w-full sm:w-1/2 lg:w-1/5 p-3">
                <div className="bg-violet-50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-violet-700 mb-1">{citationsData.length}</div>
                  <div className="text-sm text-violet-600">Total Papers</div>
                </div>
              </div>
              <div className="w-full sm:w-1/2 lg:w-1/5 p-3">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-blue-700 mb-1">
                    {processedData.domainStats['Ocean Biogeochemistry'] || 0}
                  </div>
                  <div className="text-sm text-blue-600">Ocean Chemistry</div>
                </div>
              </div>
              <div className="w-full sm:w-1/2 lg:w-1/5 p-3">
                <div className="bg-cyan-50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-purple-700 mb-1">
                    {processedData.domainStats['Marine Ecosystems'] || 0}
                  </div>
                  <div className="text-sm text-purple-600">Marine Ecosystems</div>
                </div>
              </div>
              <div className="w-full sm:w-1/2 lg:w-1/5 p-3">
                <div className="bg-teal-50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-violet-700 mb-1">
                    {citationsData.filter(p => extractYear(p) >= 2020).length}
                  </div>
                  <div className="text-sm text-violet-600">Recent Papers (2020+)</div>
                </div>
              </div>
            </div>
            
            {/* Interactive Domain visualization */}
            <div className="bg-gray-100 rounded-lg mb-8 flex flex-col border border-gray-200">
              <div className="p-4 border-b border-gray-300">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-700">Research Domain Distribution</h4>
                  <div className="text-xs text-gray-500">
                    Interactive Chart • {selectedDomain === 'all' ? citationsData.length : (processedData.domainStats[selectedDomain] || 0)} papers
                    {selectedDomain !== 'all' && (
                      <span className="ml-1 text-purple-600 font-medium">({selectedDomain})</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Domain Pie Chart Visualization */}
                  <div className="relative">
                    <h5 className="text-xs font-medium text-gray-600 mb-3">Domain Distribution</h5>
                    <div className="relative w-full h-48 flex items-center justify-center">
                      <svg width="180" height="180" viewBox="0 0 180 180" className="transform -rotate-90">
                        {(() => {
                          let cumulativeAngle = 0;
                          const total = topDomains.reduce((sum, d) => sum + d.count, 0);
                          return topDomains.slice(0, 8).map((domain, index) => {
                            const percentage = (domain.count / total) * 100;
                            const angle = (domain.count / total) * 360;
                            const startAngle = cumulativeAngle;
                            const endAngle = cumulativeAngle + angle;
                            
                            const x1 = 90 + 70 * Math.cos((startAngle * Math.PI) / 180);
                            const y1 = 90 + 70 * Math.sin((startAngle * Math.PI) / 180);
                            const x2 = 90 + 70 * Math.cos((endAngle * Math.PI) / 180);
                            const y2 = 90 + 70 * Math.sin((endAngle * Math.PI) / 180);
                            
                            const largeArcFlag = angle > 180 ? 1 : 0;
                            const pathData = [
                              `M 90 90`,
                              `L ${x1} ${y1}`,
                              `A 70 70 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                              'Z'
                            ].join(' ');
                            
                            cumulativeAngle += angle;
                            
                            return (
                              <path
                                key={index}
                                d={pathData}
                                fill={domainColors[index % domainColors.length]}
                                opacity={selectedDomain === 'all' || selectedDomain === domain.domain ? "0.8" : "0.3"}
                                className="hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                                title={`${domain.domain}: ${domain.count} papers (${percentage.toFixed(1)}%)`}
                                onClick={() => setSelectedDomain(domain.domain)}
                              />
                            );
                          });
                        })()}
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-800">{processedData.domains.length}</div>
                          <div className="text-xs text-gray-600">Domains</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Domain Legend and Stats */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-medium text-gray-600 mb-3">Top Domains</h5>
                    <div className="space-y-2 max-h-44 overflow-y-auto">
                      {topDomains.slice(0, 8).map((domain, index) => {
                        const percentage = ((domain.count / citationsData.length) * 100).toFixed(1);
                        const isSelected = selectedDomain === domain.domain;
                        
                        return (
                          <div 
                            key={index} 
                            className={`flex items-center space-x-2 p-2 rounded hover:bg-white transition-colors duration-200 cursor-pointer ${
                              isSelected ? 'bg-purple-50 ring-2 ring-purple-200' : ''
                            }`}
                            onClick={() => setSelectedDomain(domain.domain)}
                          >
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: domainColors[index % domainColors.length] }}
                            ></div>
                            <div className="flex-1 min-w-0">
                              <div className={`text-xs font-medium truncate ${isSelected ? 'text-purple-800' : 'text-gray-800'}`} title={domain.domain}>
                                {domain.domain}
                                {isSelected && <span className="ml-1 text-purple-600">●</span>}
                              </div>
                              <div className="text-xs text-gray-500">
                                {domain.count} papers ({percentage}%)
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {/* Reset filter button */}
                    {selectedDomain !== 'all' && (
                      <button
                        onClick={() => setSelectedDomain('all')}
                        className="w-full mt-2 px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition-colors duration-200"
                      >
                        Show All Domains
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Interactive Timeline - FIXED: Now updates based on domain selection */}
                <div className="pt-4 border-t border-gray-300">
                  <h5 className="text-xs font-medium text-gray-600 mb-3">
                    Publication Timeline 
                    {selectedDomain !== 'all' && (
                      <span className="text-purple-600 font-medium ml-1">- {selectedDomain}</span>
                    )}
                    <span className="text-gray-500 font-normal ml-1">(Recent Years)</span>
                  </h5>
                  <div className="relative h-32 mb-4">
                    <div className="flex items-end justify-between h-24 px-2">
                      {yearData.slice(-12).map((year, index) => {
                        const maxCount = Math.max(...yearData.slice(-12).map(y => y.count));
                        const height = maxCount > 0 ? Math.max((year.count / maxCount) * 80, 4) : 4;
                        
                        // Get the color for the selected domain
                        const getDomainTimelineColor = () => {
                          if (selectedDomain === 'all') return domainColors[0]; // Use first domain color for "all"
                          
                          const domainIndex = topDomains.findIndex(d => d.domain === selectedDomain);
                          return domainIndex >= 0 && domainIndex < domainColors.length ? domainColors[domainIndex] : '#6B7280';
                        };
                        
                        return (
                          <div key={index} className="flex flex-col items-center group relative">
                            <div className="relative">
                              <div 
                                className="w-8 rounded-t hover:opacity-80 transition-all duration-200 cursor-pointer shadow-sm"
                                style={{ 
                                  height: `${height}px`, 
                                  backgroundColor: getDomainTimelineColor() 
                                }}
                                title={`${year.year}: ${year.count} papers${selectedDomain !== 'all' ? ` in ${selectedDomain}` : ''}`}
                              >
                              </div>
                              {/* Tooltip */}
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                                <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg">
                                  <div className="font-medium">{year.year}</div>
                                  <div>{year.count} papers</div>
                                  {selectedDomain !== 'all' && (
                                    <div className="text-gray-300">{selectedDomain}</div>
                                  )}
                                </div>
                                {/* Tooltip arrow */}
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-gray-800"></div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {/* Year labels */}
                    <div className="flex justify-between mt-2 px-2">
                      {yearData.slice(-12).map((year, index) => (
                        <div key={index} className="text-xs text-gray-600 text-center" style={{ width: '32px' }}>
                          {year.year}
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Timeline summary */}
                  {yearData.length > 0 && (
                    <div className="text-xs text-gray-500 text-center">
                      Total publications in timeline: {yearData.reduce((sum, year) => sum + year.count, 0)} papers
                      {selectedDomain !== 'all' && ` in ${selectedDomain}`}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Research Papers Table */}
            <div className="overflow-x-auto">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {selectedDomain === 'all' ? 'Recent Research Papers' : `Papers in ${selectedDomain}`}
                <span className="text-sm font-normal text-gray-500 ml-2">
                  (Showing {processedData.papers.length} of {selectedDomain === 'all' ? citationsData.length : (processedData.domainStats[selectedDomain] || 0)} papers)
                </span>
              </h3>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      YEAR
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CITATIONS
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      RESEARCH DOMAIN / ENGAGEMENT LEVEL
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PUBLISHER / SOURCE
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      LINKS
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {processedData.papers.map((paper, index) => {
                    const citations = extractCitations(paper);
                    const year = extractYear(paper);
                    const source = extractSource(paper);
                    const doi = extractDOI(paper);
                    
                    return (
                      <tr key={paper.DOI || index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {year || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <span className="font-medium text-gray-900">{citations.toLocaleString()}</span>
                            <span className="text-xs text-gray-500 ml-1">citations</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {paper.research_domain && paper.research_domain !== "Unknown" ? (
                            <span className={`px-2 py-1 text-xs rounded-full ${getDomainColor(paper.research_domain)}`}>
                              {paper.research_domain}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">Not classified</span>
                          )}
                          {paper.engagement_level && (
                            <div className="mt-1">
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                {paper.engagement_level.replace("Level ", "L")}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                          <div className="space-y-1">
                            <div className="text-xs">
                              <span className="font-medium text-gray-700">Source:</span>
                              <div className="text-gray-600 truncate" title={source}>
                                {source}
                              </div>
                            </div>
                            {paper.publisher && (
                              <div className="text-xs">
                                <span className="font-medium text-gray-700">Publisher:</span>
                                <div className="text-gray-600 truncate" title={paper.publisher}>
                                  {paper.publisher}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex flex-col space-y-1">
                            {paper.URL && (
                              <a 
                                href={paper.URL} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-purple-600 hover:text-purple-800 text-xs underline"
                              >
                                View Paper
                              </a>
                            )}
                            {paper.link && paper.link.length > 0 && paper.link[0].URL && (
                              <a 
                                href={paper.link[0].URL} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-violet-600 hover:text-violet-800 text-xs underline"
                              >
                                Full Text
                              </a>
                            )}
                            {doi && (
                              <a 
                                href={`https://doi.org/${doi}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-purple-600 hover:text-purple-800 text-xs underline"
                              >
                                View DOI
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Domain Statistics */}
          <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Research Domain Distribution</h2>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Top Research Domains</h3>
              <div className="bg-gray-100 rounded-lg p-4 h-80 overflow-y-auto">
                <div className="space-y-3">
                  {topDomains.map((item, index) => {
                    // Use the same colors as pie chart and legend
                    const barColor = domainColors[index % domainColors.length];
                    
                    return (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <div className="text-sm font-medium text-gray-700 flex-1" title={item.domain}>
                            {item.domain}
                          </div>
                          <div className="text-sm font-bold text-gray-900 ml-2">
                            {item.count}
                          </div>
                        </div>
                        <div className="w-full">
                          <div 
                            className="bg-gray-200 h-4 rounded-full transition-all duration-300" 
                            style={{ width: `${(item.count / Math.max(...topDomains.map(d => d.count))) * 100}%` }}
                          >
                            <div 
                              className="h-full rounded-full opacity-80" 
                              style={{ backgroundColor: barColor }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          
          {/* Engagement Level Distribution */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Engagement Levels</h2>
            <div className="space-y-3">
              {Object.entries(engagementStats)
                .sort(([,a], [,b]) => b - a)
                .map(([level, count], index) => {
                  const percentage = ((count / citationsData.length) * 100).toFixed(1);
                  const colors = [
                    'bg-purple-100 text-purple-800',
                    'bg-violet-100 text-violet-800', 
                    'bg-indigo-100 text-indigo-800',
                    'bg-blue-100 text-blue-800',
                    'bg-cyan-100 text-cyan-800'
                  ];
                  
                  return (
                    <div key={level} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className={`px-2 py-1 text-xs rounded-full ${colors[index % colors.length]}`}>
                          {level}
                        </span>
                        <div className="text-sm font-medium text-gray-900">
                          {count} ({percentage}%)
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Data Analysis Methodology</h2>
          <p className="text-sm text-gray-600 mb-4">
            This analysis is based on {citationsData.length} research papers that cite or use the MOMO-CHEM (Model of Oceanic Mesoscale Eddies - Chemistry) model. 
            Papers are categorized by research domain, engagement level, and geographic focus based on their abstracts and metadata.
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Research domains are determined through analysis of paper content, keywords, and stated research objectives. 
            Engagement levels range from simple citations to foundational methodological contributions. Citation counts are extracted from the 
            "is-referenced-by-count" field in the academic database records.
          </p>
          <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
            <div>📊 Data source: Academic citations and research papers</div>
            <div>📈 Total citations: {citationsData.reduce((sum, paper) => sum + extractCitations(paper), 0).toLocaleString()}</div>
            <div>🌐 Coverage: {processedData.domains.length} research domains</div>
            <div>📅 Time range: {Math.min(...citationsData.map(p => extractYear(p)).filter(y => y))} - {Math.max(...citationsData.map(p => extractYear(p)).filter(y => y))}</div>
          </div>
          <div className="flex justify-end">
            <button 
              onClick={exportData}
              className="text-sm text-purple-600 hover:text-purple-800 hover:underline"
            >
              Download Full Dataset
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MOMOCHEMResearchDomainsPage;
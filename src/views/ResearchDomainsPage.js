import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Filter, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

// Import the JSON data directly
import citationsData from './rapid_20250523.json';

const ResearchDomainsPage = () => {
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [processedData, setProcessedData] = useState({
    domainStats: {},
    yearlyData: {},
    papers: [],
    domains: []
  });

  // Process the JSON data on component mount
  useEffect(() => {
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
        if (paper.year && paper.year > 2000) {
          if (!yearlyData[paper.year]) yearlyData[paper.year] = 0;
          yearlyData[paper.year]++;
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
  }, [selectedDomain]);

  // Calculate engagement level stats
  const engagementStats = React.useMemo(() => {
    const stats = {};
    citationsData.forEach(paper => {
      const level = paper.engagement_level || "Unknown";
      if (!stats[level]) stats[level] = 0;
      stats[level]++;
    });
    return stats;
  }, []);

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
      "Water Resources": "bg-blue-100 text-blue-800",
      "Flood Prediction": "bg-red-100 text-red-800",
      "River Modeling": "bg-green-100 text-green-800",
      "Global River Modeling": "bg-teal-100 text-teal-800",
      "Flow Analysis": "bg-purple-100 text-purple-800",
      "Streamflow": "bg-indigo-100 text-indigo-800",
      "Hydrological Modeling": "bg-cyan-100 text-cyan-800",
      "Hydrology": "bg-emerald-100 text-emerald-800"
    };
    return colors[domain] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center">
            <Link to="/" className="flex items-center text-blue-600 hover:text-blue-800 mr-6">
              <ArrowLeft size={18} className="mr-1" />
              <span className="font-medium">Back to Dashboard</span>
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Research Domains Analysis</h1>
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
                  Analysis of {citationsData.length} research papers using RAPID across different domains
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
                
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  <Download size={16} />
                  <span>Export Analysis</span>
                </button>
              </div>
            </div>
            
            <div className="flex flex-wrap text-center mb-6">
              <div className="w-full sm:w-1/2 lg:w-1/5 p-3">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-blue-700 mb-1">{processedData.domains.length}</div>
                  <div className="text-sm text-blue-600">Research Domains</div>
                </div>
              </div>
              <div className="w-full sm:w-1/2 lg:w-1/5 p-3">
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-green-700 mb-1">{citationsData.length}</div>
                  <div className="text-sm text-green-600">Total Papers</div>
                </div>
              </div>
              <div className="w-full sm:w-1/2 lg:w-1/5 p-3">
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-purple-700 mb-1">
                    {processedData.domainStats['Flood Prediction'] || 0}
                  </div>
                  <div className="text-sm text-purple-600">Flood Prediction</div>
                </div>
              </div>
              <div className="w-full sm:w-1/2 lg:w-1/5 p-3">
                <div className="bg-amber-50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-amber-700 mb-1">
                    {processedData.domainStats['River Modeling'] || 0}
                  </div>
                  <div className="text-sm text-amber-600">River Modeling</div>
                </div>
              </div>
              <div className="w-full sm:w-1/2 lg:w-1/5 p-3">
                <div className="bg-teal-50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-teal-700 mb-1">
                    {citationsData.filter(p => p.year >= 2020).length}
                  </div>
                  <div className="text-sm text-teal-600">Recent Papers (2020+)</div>
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
                      <span className="ml-1 text-blue-600 font-medium">({selectedDomain})</span>
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
                          const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4', '#F97316', '#EC4899'];
                          
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
                                fill={colors[index % colors.length]}
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
                        const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4', '#F97316', '#EC4899'];
                        const percentage = ((domain.count / citationsData.length) * 100).toFixed(1);
                        const isSelected = selectedDomain === domain.domain;
                        
                        return (
                          <div 
                            key={index} 
                            className={`flex items-center space-x-2 p-2 rounded hover:bg-white transition-colors duration-200 cursor-pointer ${
                              isSelected ? 'bg-blue-50 ring-2 ring-blue-200' : ''
                            }`}
                            onClick={() => setSelectedDomain(domain.domain)}
                          >
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: colors[index % colors.length] }}
                            ></div>
                            <div className="flex-1 min-w-0">
                              <div className={`text-xs font-medium truncate ${isSelected ? 'text-blue-800' : 'text-gray-800'}`} title={domain.domain}>
                                {domain.domain}
                                {isSelected && <span className="ml-1 text-blue-600">●</span>}
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
                      <span className="text-blue-600 font-medium ml-1">- {selectedDomain}</span>
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
                          if (selectedDomain === 'all') return 'bg-blue-500 hover:bg-blue-600';
                          
                          const colors = ['bg-blue-500 hover:bg-blue-600', 'bg-red-500 hover:bg-red-600', 'bg-green-500 hover:bg-green-600', 'bg-yellow-500 hover:bg-yellow-600', 'bg-purple-500 hover:bg-purple-600', 'bg-cyan-500 hover:bg-cyan-600', 'bg-orange-500 hover:bg-orange-600', 'bg-pink-500 hover:bg-pink-600'];
                          const domainIndex = topDomains.findIndex(d => d.domain === selectedDomain);
                          return domainIndex >= 0 && domainIndex < colors.length ? colors[domainIndex] : 'bg-gray-500 hover:bg-gray-600';
                        };
                        
                        return (
                          <div key={index} className="flex flex-col items-center group relative">
                            <div className="relative">
                              <div 
                                className={`w-8 rounded-t hover:opacity-80 transition-all duration-200 cursor-pointer shadow-sm ${getDomainTimelineColor()}`}
                                style={{ height: `${height}px` }}
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
                      Rank
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paper Title & Source
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Authors
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Year
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Citations
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Research Domain
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Watershed
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {processedData.papers.map((paper, index) => (
                    <tr key={paper.uid || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {paper.rank || index + 1}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-lg">
                        <div className="mb-1">
                          <div className="font-medium text-gray-900 leading-tight" title={paper.title}>
                            {paper.title || "Untitled Paper"}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{paper.source || "Unknown Source"}</span>
                            {paper.publisher && (
                              <span className="text-gray-400">• {paper.publisher}</span>
                            )}
                          </div>
                          {paper.doi && (
                            <div className="text-blue-600">
                              DOI: {paper.doi}
                            </div>
                          )}
                          {paper.abstract && (
                            <div className="text-gray-600 line-clamp-2" title={paper.abstract}>
                              {paper.abstract.length > 150 
                                ? `${paper.abstract.substring(0, 150)}...` 
                                : paper.abstract}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                        <div className="truncate" title={Array.isArray(paper.authors) ? paper.authors.join(", ") : "Unknown Authors"}>
                          {Array.isArray(paper.authors) 
                            ? paper.authors.length > 3 
                              ? `${paper.authors.slice(0, 3).join(", ")} et al.`
                              : paper.authors.join(", ")
                            : "Unknown Authors"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {paper.year || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-900">{paper.cites || 0}</span>
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
                          {paper.watershed && paper.watershed !== "Unknown" && (
                            <div className="text-xs">
                              <span className="font-medium text-gray-700">Watershed:</span>
                              <div className="text-gray-600">{paper.watershed}</div>
                            </div>
                          )}
                          {paper.country && paper.country !== "Unknown" && (
                            <div className="text-xs">
                              <span className="font-medium text-gray-700">Country:</span>
                              <div className="text-gray-600">{paper.country}</div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-col space-y-1">
                          {paper.article_url && (
                            <a 
                              href={paper.article_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-xs underline"
                            >
                              View Paper
                            </a>
                          )}
                          {paper.fulltext_url && (
                            <a 
                              href={paper.fulltext_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-green-600 hover:text-green-800 text-xs underline"
                            >
                              Full Text
                            </a>
                          )}
                          {paper.cites_url && (
                            <a 
                              href={paper.cites_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-purple-600 hover:text-purple-800 text-xs underline"
                            >
                              Citations
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
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
                  {topDomains.map((item, index) => (
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
                          className="bg-blue-200 h-4 rounded-full transition-all duration-300" 
                          style={{ width: `${(item.count / Math.max(...topDomains.map(d => d.count))) * 100}%` }}
                        >
                          <div className="h-full bg-blue-500 rounded-full opacity-80"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Data Analysis Methodology</h2>
          <p className="text-sm text-gray-600 mb-4">
            This analysis is based on {citationsData.length} research papers that cite or use the RAPID (Routing Application for Parallel computatIon of Discharge) model. 
            Papers are categorized by research domain, engagement level, and geographic focus based on their abstracts and metadata.
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Research domains are determined through analysis of paper content, keywords, and stated research objectives. 
            Engagement levels range from simple citations to foundational methodological contributions.
          </p>
          <div className="flex justify-end">
            <a href="#" className="text-sm text-blue-600 hover:text-blue-800 hover:underline">Download Full Dataset</a>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResearchDomainsPage;
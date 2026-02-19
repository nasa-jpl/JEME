// Generic Research Domains Page component that works with any model
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Filter, BarChart3 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { getModelConfig } from '../config/modelConfig';

const GenericResearchDomainsPage = () => {
  const { modelName } = useParams();
  const modelConfig = getModelConfig(modelName);
  
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [processedData, setProcessedData] = useState({
    domainStats: {},
    yearlyData: {},
    papers: [],
    domains: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [citationsData, setCitationsData] = useState([]);

  // Load model-specific data
  useEffect(() => {
    const loadModelData = async () => {
      if (!modelConfig) {
        setError(`Model "${modelName}" not found`);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log(`Loading research domains data for ${modelConfig.displayName}`);
        
        // Load the model's JSON data from public/data/
        const { loadModelData } = await import('../utils/dataLoader');
        const data = await loadModelData(modelName);
        setCitationsData(data);
        
        processData(data);
      } catch (error) {
        console.error('Error loading model data:', error);
        setError(`Error loading data for ${modelConfig.displayName}: ${error.message}`);
        setDemoData();
      } finally {
        setLoading(false);
      }
    };

    loadModelData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelName, modelConfig]);

  // Process the JSON data on component mount and when domain filter changes
  useEffect(() => {
    if (citationsData.length > 0) {
      processData(citationsData);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDomain, citationsData]);

  const processData = (data) => {
    try {
      // Extract unique research domains
      const domains = [...new Set(data
        .map(paper => paper.research_domain)
        .filter(domain => domain && domain !== "Unknown" && domain !== "Not specified")
      )];

      // Count papers by domain
      const domainStats = {};
      domains.forEach(domain => {
        domainStats[domain] = data.filter(paper => 
          paper.research_domain === domain
        ).length;
      });

      // Group papers by year - Filter by selected domain first
      const yearlyData = {};
      const filteredDataForYear = selectedDomain === 'all' 
        ? data 
        : data.filter(paper => paper.research_domain === selectedDomain);
      
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
        ? data.slice(0, 50) // Show first 50 papers
        : data.filter(paper => paper.research_domain === selectedDomain).slice(0, 50);

      setProcessedData({
        domainStats,
        yearlyData,
        papers: filteredPapers,
        domains
      });
      
      setError(null);
    } catch (error) {
      console.error('Error processing research domains data:', error);
      setError(`Error processing data: ${error.message}`);
      setDemoData();
    }
  };

  // Set demo data (fallback)
  const setDemoData = () => {
    console.log(`Setting up demo research domains data for ${modelConfig.displayName}`);
    
    const mockDomains = [modelConfig.domain || 'Unknown'];
    const mockDomainStats = {};
    mockDomainStats[mockDomains[0]] = 5;
    
    const mockYearlyData = { 2020: 2, 2021: 1, 2022: 2 };
    
    const mockPapers = [
      {
        title: `Example Research Using ${modelConfig.displayName}`,
        year: 2020,
        research_domain: mockDomains[0],
        engagement_level: 'Level 2: Data Usage'
      }
    ];

    setProcessedData({
      domainStats: mockDomainStats,
      yearlyData: mockYearlyData,
      papers: mockPapers,
      domains: mockDomains
    });
    
    setError(`Using demo research domains data for ${modelConfig.displayName}.`);
  };

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

  // Yearly publication data - Now uses filtered data
  const yearData = React.useMemo(() => {
    return Object.keys(processedData.yearlyData)
      .sort()
      .map(year => ({ 
        year, 
        count: processedData.yearlyData[year] 
      }));
  }, [processedData.yearlyData]);

  // Engagement level data for pie chart
  const engagementData = React.useMemo(() => {
    return Object.entries(engagementStats)
      .map(([level, count]) => ({
        name: level.replace('Level ', 'L'),
        value: count,
        fullName: level
      }))
      .sort((a, b) => b.value - a.value);
  }, [engagementStats]);

  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Helper function to get domain colors
  const getDomainColor = (domain) => {
    const colors = {
      "Water Resources": "bg-blue-100 text-blue-800",
      "Flood Prediction": "bg-red-100 text-red-800",
      "River Modeling": "bg-green-100 text-green-800",
      "Global River Modeling": "bg-teal-100 text-teal-800",
      "Flow Analysis": "bg-purple-100 text-purple-800",
      "Streamflow": "bg-indigo-100 text-indigo-800",
      "Hydrological Modeling": "bg-cyan-100 text-cyan-800",
      "Hydrology": "bg-emerald-100 text-emerald-800",
      "Hydrologic Modeling": "bg-sky-100 text-sky-800",
      "Carbon Flux": "bg-amber-100 text-amber-800",
      "Atmospheric Science": "bg-orange-100 text-orange-800",
      "Climate Modeling": "bg-rose-100 text-rose-800",
      "Ocean Modeling": "bg-blue-200 text-blue-900",
      "Ice Sheet Modeling": "bg-slate-100 text-slate-800",
      "Atmospheric Chemistry": "bg-lime-100 text-lime-800"
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

  // Helper function to extract authors from paper
  const extractAuthors = (paper) => {
    if (paper.authors && Array.isArray(paper.authors)) {
      return paper.authors;
    }
    if (paper.author && Array.isArray(paper.author)) {
      return paper.author.map(author => {
        if (typeof author === 'string') return author;
        if (author.given && author.family) return `${author.given} ${author.family}`;
        if (author.family) return author.family;
        return 'Unknown Author';
      });
    }
    return [];
  };

  // Helper function to extract citations count
  const extractCitations = (paper) => {
    return paper['is-referenced-by-count'] || paper.citation_count || paper.cites || paper.citations || 0;
  };

  // Helper function to extract title
  const extractTitle = (paper) => {
    if (paper.title) {
      if (Array.isArray(paper.title)) {
        return paper.title[0] || "Untitled Paper";
      }
      return paper.title;
    }
    return "Untitled Paper";
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

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Export functions
  const exportDomainsCSV = () => {
    const headers = ['Research Domain', 'Paper Count'];
    const rows = topDomains.map(d => [d.domain, d.count]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${modelName}_research_domains.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!modelConfig) {
    return (
      <div className="bg-gray-100 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">Model Not Found</h1>
            <p className="text-gray-600 mt-2">The model "{modelName}" is not configured.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center">
            <Link to={`/science-model-dashboard/${modelName}`} className="flex items-center text-blue-600 hover:text-blue-800 mr-6">
              <ArrowLeft size={18} className="mr-1" />
              <span className="font-medium">Back to {modelConfig.displayName} Dashboard</span>
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">{modelConfig.displayName} Research Domains</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4 mb-6">
            <p className="font-medium">Notice</p>
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-6 flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading research domains data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Summary Statistics */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="text-lg font-semibold text-gray-800 mb-4">{modelConfig.displayName} Research Overview</div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-blue-700 mb-1">Research Domains</div>
                  <div className="text-2xl font-bold text-blue-900">{processedData.domains.length}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm text-green-700 mb-1">Total Papers</div>
                  <div className="text-2xl font-bold text-green-900">{citationsData.length}</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-4">
                  <div className="text-sm text-amber-700 mb-1">Most Active Domain</div>
                  <div className="text-lg font-bold text-amber-900">
                    {topDomains.length > 0 ? topDomains[0].domain.substring(0, 15) + '...' : 'N/A'}
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-sm text-purple-700 mb-1">Years Active</div>
                  <div className="text-2xl font-bold text-purple-900">
                    {yearData.length > 0 ? `${Math.min(...yearData.map(d => parseInt(d.year)))}-${Math.max(...yearData.map(d => parseInt(d.year)))}` : 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="text-lg font-semibold text-gray-800">Research Domain Analysis</div>
                  <p className="text-sm text-gray-500 mt-1">
                    Explore {modelConfig.displayName} applications across different research fields
                  </p>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Filter size={16} className="text-gray-400" />
                    <select
                      value={selectedDomain}
                      onChange={(e) => setSelectedDomain(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
                    >
                      <option value="all">All Domains</option>
                      {processedData.domains.map(domain => (
                        <option key={domain} value={domain}>{domain}</option>
                      ))}
                    </select>
                  </div>
                  <button 
                    onClick={exportDomainsCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <Download size={16} />
                    <span>Export</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Research Domains Bar Chart */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 size={18} className="text-gray-400" />
                  <div className="text-lg font-semibold text-gray-800">Research Domains</div>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topDomains} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="domain" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval={0}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Engagement Levels Pie Chart */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-lg font-semibold text-gray-800 mb-4">Engagement Levels</div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={engagementData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {engagementData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Yearly Publications Trend */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="text-lg font-semibold text-gray-800 mb-4">
                Publications Over Time
                {selectedDomain !== 'all' && ` - ${selectedDomain}`}
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={yearData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Papers Table */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-lg font-semibold text-gray-800 mb-4">
                Recent Publications
                {selectedDomain !== 'all' && ` in ${selectedDomain}`}
              </div>
              <p className="text-sm text-gray-500 mb-6">
                Latest research papers using {modelConfig.displayName}
              </p>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Year
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Domain
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Engagement
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Citations
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {processedData.papers.length > 0 ? processedData.papers.map((paper, index) => {
                      const authors = extractAuthors(paper);
                      const year = extractYear(paper);
                      const title = extractTitle(paper);
                      const source = extractSource(paper);
                      const citations = extractCitations(paper);
                      
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900 max-w-md">
                              {title}
                            </div>
                            {authors.length > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                {authors.slice(0, 3).join(', ')}
                                {authors.length > 3 && ' et al.'}
                              </div>
                            )}
                            {source && source !== 'Unknown Source' && (
                              <div className="text-xs text-gray-400 mt-1">{source}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{year || 'Unknown'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDomainColor(paper.research_domain || 'Unknown')}`}>
                              {paper.research_domain || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs text-gray-600 max-w-32">
                              {paper.engagement_level ? paper.engagement_level.replace('Level ', 'L') : 'Unknown'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {citations.toLocaleString()}
                            </div>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                          No publications found for the selected criteria
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default GenericResearchDomainsPage;
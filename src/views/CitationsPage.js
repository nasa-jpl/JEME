// src/views/CitationsPage.js
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Search, Filter, SortAsc, SortDesc } from 'lucide-react';
import { Link } from 'react-router-dom';

// Import the JSON data directly
// Note: You'll need to place the rapid_265citations.json file in the same directory as this component
// or adjust the path accordingly
import citationsData from './rapid_265citations.json';

const CitationsPage = () => {
  const [citations, setCitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('cites');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterType, setFilterType] = useState('all');
  const [yearRange, setYearRange] = useState([2011, 2025]);
  const [error, setError] = useState(null);
  
  // Process the imported JSON data
  useEffect(() => {
    try {
      setLoading(true);
      console.log(`Processing ${citationsData.length} directly imported citations`);
      processCitationData(citationsData);
    } catch (error) {
      console.error('Error processing imported data:', error);
      setError(`Error: ${error.message}`);
      setDemoData();
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Process the citation data
  const processCitationData = (data) => {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("Invalid JSON data format or empty data");
    }
    
    // Transform the data
    const transformedData = data.map((citation, index) => {
      // Handle different author formats
      let authorString = 'Unknown';
      if (Array.isArray(citation.authors)) {
        authorString = citation.authors.join(', ');
      } else if (typeof citation.authors === 'string') {
        authorString = citation.authors;
      }
      
      // Check for trailing ellipsis in author string which indicates truncation
      if (authorString.endsWith('...')) {
        authorString = authorString.replace(/\s*\.\.\.$/, ' et al.');
      }
      
      // Determine URLs
      const url = citation.article_url || citation.fulltext_url || citation.cites_url || '';
      
      // Determine if this is a key paper
      const title = String(citation.title || '').toLowerCase();
      const isOriginalPaper = 
        title.includes('rapid applied') || 
        title.includes('routing application') ||
        (title.includes('river') && title.includes('routing')) ||
        (title.includes('rapid') && title.includes('model'));
      
      return {
        id: index + 1,
        title: citation.title || 'Untitled',
        authors: authorString,
        year: citation.year || 'Unknown',
        source: citation.source || 'Unknown',
        publisher: citation.publisher || '',
        doi: citation.doi || '',
        type: citation.type || '',
        cites: citation.cites || 0,
        url: url,
        fulltext_url: citation.fulltext_url || '',
        cites_url: citation.cites_url || '',
        abstract: citation.abstract || 'No abstract available',
        isOriginalPaper: isOriginalPaper
      };
    });
    
    // Sort by citation count
    transformedData.sort((a, b) => b.cites - a.cites);
    
    console.log(`Transformed ${transformedData.length} citations`);
    setCitations(transformedData);
    
    // Update year range
    const years = transformedData
      .map(c => c.year)
      .filter(year => typeof year === 'number');
    
    if (years.length > 0) {
      setYearRange([Math.min(...years), Math.max(...years)]);
    }
    
    // Clear existing demo data notification
    setError(null);
  };
  
  // Set demo data
  const setDemoData = () => {
    console.log("Setting up demo citation data");
    
    // Create some sample citation data
    const mockCitations = [
      {
        id: 1,
        title: "RAPID applied to the SIM‐France model",
        authors: "David CH, Habets F, Maidment DR, Yang ZL",
        year: 2011,
        source: "Hydrological Processes",
        publisher: "Wiley Online Library",
        doi: "10.1002/hyp.8070",
        type: "HTML",
        cites: 99,
        url: "https://onlinelibrary.wiley.com/doi/abs/10.1002/hyp.8070",
        isOriginalPaper: true
      },
      {
        id: 2,
        title: "Global river hydrography and network routing: baseline data and new approaches to study the world's large river systems",
        authors: "Lehner B, Grill G",
        year: 2013,
        source: "Hydrological Processes",
        publisher: "Wiley Online Library",
        doi: "10.1002/HYP.9740",
        type: "PDF",
        cites: 1579,
        isOriginalPaper: false
      },
      {
        id: 3,
        title: "A systematic review of Muskingum flood routing techniques",
        authors: "Salvati A, Moghaddam Nia A",
        year: 2024,
        source: "Hydrological Sciences Journal",
        publisher: "Taylor & Francis",
        doi: "10.1080/02626667.2024.2324132",
        type: "HTML",
        cites: 8,
        isOriginalPaper: false
      },
      {
        id: 4,
        title: "Global reconstruction of naturalized river flows at 2.94 million reaches",
        authors: "Lin P, Pan M, Beck HE, Yang Y",
        year: 2019,
        source: "Water Resources Research",
        publisher: "Wiley Online Library",
        doi: "10.1029/2019wr025287",
        type: "PDF",
        cites: 288,
        isOriginalPaper: false
      },
      {
        id: 5,
        title: "The critical role of the routing scheme in simulating peak river discharge in global hydrological models",
        authors: "Zhao F, Veldkamp TIE, Frieler K",
        year: 2017,
        source: "Environmental Research Letters",
        publisher: "IOP Science",
        doi: "10.1088/1748-9326/aa7250",
        type: "HTML",
        cites: 161,
        isOriginalPaper: false
      }
    ];
    
    // Add some more varied citation counts
    for (let i = 6; i <= 25; i++) {
      mockCitations.push({
        id: i,
        title: `Hydrological modeling paper ${i}`,
        authors: `Author ${i}`,
        year: 2010 + Math.floor(Math.random() * 15),
        source: ["Journal of Hydrology", "Water Resources Research", "Environmental Science", "Hydrological Processes", "Science"][i % 5],
        publisher: ["Elsevier", "Wiley", "Springer", "Nature Publishing Group", "AAAS"][i % 5],
        doi: i % 3 === 0 ? `10.1234/water.${2025-i}.${i*111}` : "",
        type: ["HTML", "PDF", "CITATION", "BOOK", "HTML"][i % 5],
        cites: Math.floor(Math.random() * 200),
        isOriginalPaper: false
      });
    }
    
    // Sort by citation count
    mockCitations.sort((a, b) => b.cites - a.cites);
    
    setCitations(mockCitations);
    setLoading(false);
    setError("Using demo data. JSON file could not be imported properly.");
  };
  
  // Filter citations
  const filteredCitations = citations.filter(citation => {
    // Filter by search term (search in title, authors, source, abstract, doi)
    const searchMatch = searchTerm === '' || [
      citation.title,
      citation.authors,
      citation.source,
      citation.publisher,
      citation.abstract,
      citation.doi
    ].some(field => 
      field && String(field).toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Filter by type (handle HTML, PDF types from URL patterns)
    let typeMatch = filterType === 'all';
    
    if (filterType === 'HTML') {
      typeMatch = citation.type === 'HTML' || 
                 (citation.url && citation.url.includes('html')) ||
                 (citation.url && (citation.url.includes('www.') || 
                                   citation.url.includes('/articles/')));
    } else if (filterType === 'PDF') {
      typeMatch = citation.type === 'PDF' || 
                 (citation.url && citation.url.includes('pdf'));
    } else if (filterType === 'BOOK') {
      typeMatch = citation.type === 'BOOK';
    } else if (filterType === 'CITATION') {
      typeMatch = citation.type === 'CITATION';
    }
    
    // Filter by year
    const yearMatch = 
      (typeof citation.year === 'number') && 
      citation.year >= yearRange[0] && 
      citation.year <= yearRange[1];
    
    return searchMatch && typeMatch && (typeof citation.year === 'number' ? yearMatch : true);
  });
  
  // Sort citations
  const sortedCitations = [...filteredCitations].sort((a, b) => {
    // Handle sort by original paper
    if (sortField === 'isoriginalpaper') {
      return sortDirection === 'asc' 
        ? (a.isOriginalPaper ? 1 : 0) - (b.isOriginalPaper ? 1 : 0)
        : (b.isOriginalPaper ? 1 : 0) - (a.isOriginalPaper ? 1 : 0);
    }
    
    // Handle null values
    const aValue = a[sortField] !== undefined && a[sortField] !== null ? a[sortField] : '';
    const bValue = b[sortField] !== undefined && b[sortField] !== null ? b[sortField] : '';
    
    // Sort numerically or alphabetically
    let comparison = 0;
    if (['cites', 'year', 'citesperyear'].includes(sortField)) {
      comparison = parseFloat(aValue) - parseFloat(bValue);
    } else {
      comparison = String(aValue).toLowerCase().localeCompare(String(bValue).toLowerCase());
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });
  
  // Handle sort click
  const handleSort = (field) => {
    const normalizedField = field.toLowerCase();
    if (sortField === normalizedField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(normalizedField);
      setSortDirection('desc');
    }
  };
  
  // Export data as CSV
  const exportCSV = () => {
    const headers = ['Title', 'Authors', 'Year', 'Source', 'Publisher', 'DOI', 'Citations'];
    const rows = sortedCitations.map(c => [
      c.title, c.authors, c.year, c.source, c.publisher, c.doi, c.cites
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        const value = cell === null || cell === undefined ? '' : String(cell);
        return `"${value.replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'rapid_citations.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Calculate citation stats
  const citationStats = {
    total: citations.length,
    withDoi: citations.filter(c => c.doi).length,
    mostCited: citations.length > 0 ? Math.max(...citations.map(c => c.cites || 0)) : 0,
    totalCitations: citations.reduce((sum, citation) => sum + (citation.cites || 0), 0),
    averageCitations: citations.length > 0 
      ? Math.round(citations.reduce((sum, citation) => sum + (citation.cites || 0), 0) / citations.length) 
      : 0
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
            <h1 className="text-xl font-semibold text-gray-900">RAPID Citation Analytics</h1>
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
              <p className="text-gray-600">Loading citation data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Statistics Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="text-lg font-semibold text-gray-800 mb-4">Citation Statistics</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-blue-700 mb-1">Total Publications</div>
                  <div className="text-2xl font-bold text-blue-900">{citationStats.total}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm text-green-700 mb-1">Total Citations</div>
                  <div className="text-2xl font-bold text-green-900">{citationStats.totalCitations}</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-4">
                  <div className="text-sm text-amber-700 mb-1">Most Cited Paper</div>
                  <div className="text-2xl font-bold text-amber-900">
                    {citationStats.mostCited}
                    <span className="text-sm font-normal text-amber-700 ml-2">citations</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-indigo-50 rounded-lg p-4">
                  <div className="text-sm text-indigo-700 mb-1">DOI Available</div>
                  <div className="text-2xl font-bold text-indigo-900">
                    {citationStats.withDoi} 
                    <span className="text-sm font-normal text-indigo-700 ml-2">
                      ({citationStats.total > 0 ? Math.round(citationStats.withDoi / citationStats.total * 100) : 0}%)
                    </span>
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-sm text-purple-700 mb-1">Average Citations per Paper</div>
                  <div className="text-2xl font-bold text-purple-900">
                    {citationStats.averageCitations}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Citation Table */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <div className="text-lg font-semibold text-gray-800">Citation Data</div>
                  <p className="text-sm text-gray-500 mt-1">
                    Analysis of papers related to river routing and hydrological modeling
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={exportCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <Download size={16} />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 mb-6">
                {/* Search input */}
                <div className="flex-1 min-w-[280px] relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search citations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                {/* Filter dropdown */}
                <div className="w-56">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <Filter size={16} className="text-gray-400" />
                    </div>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="appearance-none w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg bg-white"
                    >
                      <option value="all">All Types</option>
                      <option value="HTML">Journal (HTML)</option>
                      <option value="PDF">Journal (PDF)</option>
                      <option value="BOOK">Book</option>
                      <option value="CITATION">Citation</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 mb-4">
                Showing {sortedCitations.length} of {citations.length} publications
              </div>
              
              {/* Citation table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('isoriginalpaper')}
                      >
                        <div className="flex items-center">
                          <span>Type</span>
                          {sortField === 'isoriginalpaper' && (
                            sortDirection === 'asc' ? <SortAsc size={14} className="ml-1" /> : <SortDesc size={14} className="ml-1" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('title')}
                      >
                        <div className="flex items-center">
                          <span>Title</span>
                          {sortField === 'title' && (
                            sortDirection === 'asc' ? <SortAsc size={14} className="ml-1" /> : <SortDesc size={14} className="ml-1" />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Authors
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('year')}
                      >
                        <div className="flex items-center">
                          <span>Year</span>
                          {sortField === 'year' && (
                            sortDirection === 'asc' ? <SortAsc size={14} className="ml-1" /> : <SortDesc size={14} className="ml-1" />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Source
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('cites')}
                      >
                        <div className="flex items-center">
                          <span>Citations</span>
                          {sortField === 'cites' && (
                            sortDirection === 'asc' ? <SortAsc size={14} className="ml-1" /> : <SortDesc size={14} className="ml-1" />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Links
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedCitations.length > 0 ? sortedCitations.map((citation) => (
                      <tr key={citation.id} className={`hover:bg-gray-50 ${citation.isOriginalPaper ? 'bg-blue-50' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {citation.isOriginalPaper ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Key Paper
                            </span>
                          ) : citation.url && citation.url.includes('pdf') ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                              PDF
                            </span>
                          ) : citation.url && (citation.url.includes('html') || citation.url.includes('www.')) ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              HTML
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">{citation.type || 'Citation'}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-normal">
                          <div className="text-sm font-medium text-gray-900">{citation.title}</div>
                          {citation.doi && (
                            <div className="text-xs text-gray-500 mt-1">
                              DOI: {citation.doi}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500 max-w-md truncate" title={citation.authors}>
                            {citation.authors}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{citation.year}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{citation.source}</div>
                          {citation.publisher && (
                            <div className="text-xs text-gray-400">{citation.publisher}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{citation.cites}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-x-2">
                            {citation.url && (
                              <a 
                                href={citation.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                Article
                              </a>
                            )}
                            {citation.fulltext_url && citation.fulltext_url !== citation.url && (
                              <a 
                                href={citation.fulltext_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-green-600 hover:text-green-800 text-sm"
                              >
                                Full Text
                              </a>
                            )}
                            {citation.cites_url && (
                              <a 
                                href={citation.cites_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-amber-600 hover:text-amber-800 text-sm"
                              >
                                Citations
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                          No citations match your search criteria
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

export default CitationsPage;
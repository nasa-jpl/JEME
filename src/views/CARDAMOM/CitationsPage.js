// src/views/CitationsPage.js
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Search, Filter, SortAsc, SortDesc } from 'lucide-react';
import { Link } from 'react-router-dom';

// Import the JSON data directly
// Note: You'll need to place the crossref_data.json file in the same directory as this component
// or adjust the path accordingly
import citationsData from '../../data/CARDAMOM/cardamom.json';

// Multi-select component
const MultiSelect = ({ options, selectedValues, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleToggleOption = (option) => {
    const newSelected = selectedValues.includes(option)
      ? selectedValues.filter(item => item !== option)
      : [...selectedValues, option];
    onChange(newSelected);
  };
  
  const clearAll = () => {
    onChange([]);
  };
  
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between"
      >
        <span className="text-sm">
          {selectedValues.length === 0 
            ? placeholder 
            : `${selectedValues.length} selected`
          }
        </span>
        <Filter size={16} className="text-gray-400" />
      </button>
      
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          <div className="p-2 border-b border-gray-200">
            <button
              onClick={clearAll}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Clear All
            </button>
          </div>
          <div className="p-1">
            {options.map((option) => (
              <label
                key={option}
                className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option)}
                  onChange={() => handleToggleOption(option)}
                  className="mr-3 h-4 w-4 text-blue-600 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700 truncate" title={option}>
                  {option}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const CitationsPage = () => {
  const [citations, setCitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('cites');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterEngagement, setFilterEngagement] = useState('all');
  const [filterDomain, setFilterDomain] = useState([]);
  const [filterWatershed, setFilterWatershed] = useState([]);
  const [filterCountry, setFilterCountry] = useState('all');
  const [yearRange, setYearRange] = useState([2011, 2025]);
  const [error, setError] = useState(null);
  
  // Process the imported JSON data
  useEffect(() => {
    try {
      setLoading(true);
      console.log('Processing Crossref citation data');
      processCrossrefData(citationsData);
    } catch (error) {
      console.error('Error processing imported data:', error);
      setError(`Error: ${error.message}`);
      setDemoData();
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Extract year from date-parts array
  const extractYear = (dateObj) => {
    if (!dateObj || !dateObj['date-parts'] || !Array.isArray(dateObj['date-parts'][0])) {
      return null;
    }
    return dateObj['date-parts'][0][0];
  };
  
  // Format authors from Crossref format
  const formatAuthors = (authorArray) => {
    if (!Array.isArray(authorArray) || authorArray.length === 0) {
      return 'Unknown';
    }
    
    const formattedAuthors = authorArray.map(author => {
      const given = author.given || '';
      const family = author.family || '';
      return `${family}${given ? ', ' + given : ''}`;
    });
    
    if (formattedAuthors.length > 3) {
      return formattedAuthors.slice(0, 3).join('; ') + ' et al.';
    }
    
    return formattedAuthors.join('; ');
  };
  
  // Extract abstract text from JATS format
  const extractAbstract = (abstractHtml) => {
    if (!abstractHtml) return 'No abstract available';
    
    // Remove JATS tags and clean up HTML
    return abstractHtml
      .replace(/<jats:[^>]*>/g, '')
      .replace(/<\/jats:[^>]*>/g, '')
      .replace(/<[^>]*>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
  };
  
  // Process Crossref data format
  const processCrossrefData = (data) => {
    // Handle both single object and array formats
    const records = Array.isArray(data) ? data : [data];
    
    if (records.length === 0) {
      throw new Error("No data found in JSON file");
    }
    
    console.log(`Processing ${records.length} Crossref records`);
    
    // Transform the Crossref data
    const transformedData = records.map((record, index) => {
      // Extract publication year
      const publishedYear = extractYear(record.published) || 
                           extractYear(record['published-online']) || 
                           extractYear(record['published-print']);
      
      // Format title (remove array wrapper if present)
      const title = Array.isArray(record.title) ? record.title[0] : record.title || 'Untitled';
      
      // Format authors
      const authors = formatAuthors(record.author);
      
      // Extract journal/source info
      const source = Array.isArray(record['container-title']) 
        ? record['container-title'][0] 
        : record['container-title'] || record.publisher || 'Unknown';
      
      // Extract abstract
      const abstract = extractAbstract(record.abstract);
      
      // Construct URL
      const url = record.URL || (record.DOI ? `https://doi.org/${record.DOI}` : '');
      
      // Use engagement level from JSON file if available, otherwise use default
      let engagementLevel = record.engagement_level || 'Level 1: Basic Citation';
      
      // If engagement_level is not in the JSON, fall back to citation-based determination
      if (!record.engagement_level) {
        const citationCount = record['is-referenced-by-count'] || 0;
        if (citationCount > 500) {
          engagementLevel = 'Level 4: Foundational Method';
        } else if (citationCount > 100) {
          engagementLevel = 'Level 3: Model Adaptation';
        } else if (citationCount > 20) {
          engagementLevel = 'Level 2: Data Usage';
        }
      }
      
      // Determine research domain from JSON or title keywords
      let researchDomain = record.research_domain || 'Water Resources';
      if (!record.research_domain) {
        if (title.toLowerCase().includes('hydro')) {
          researchDomain = 'Hydrology';
        } else if (title.toLowerCase().includes('river') || title.toLowerCase().includes('flow')) {
          researchDomain = 'River Modeling';
        } else if (title.toLowerCase().includes('climate')) {
          researchDomain = 'Climate Science';
        }
      }
      
      // Extract watershed and country info (use from JSON if available)
      const watershed = record.watershed || 'Global';
      const country = record.country || 'Global';
      
      // Check if this is a key RAPID paper
      const isOriginalPaper = title.toLowerCase().includes('rapid') && 
                             title.toLowerCase().includes('routing');
      
      return {
        id: index + 1,
        title: title,
        authors: authors,
        year: publishedYear || 'Unknown',
        source: source,
        publisher: record.publisher || '',
        doi: record.DOI || '',
        cites: record['is-referenced-by-count'] || 0,
        url: url,
        fulltext_url: url,
        cites_url: record.DOI ? `https://scholar.google.com/scholar?cites=${record.DOI}` : '',
        abstract: abstract,
        engagement_level: engagementLevel,
        research_domain: researchDomain,
        watershed: watershed,
        country: country,
        isOriginalPaper: isOriginalPaper,
        pages: record.page || '',
        volume: record.volume || '',
        issue: record.issue || '',
        referenceCount: record['references-count'] || 0
      };
    });
    
    // Sort by citation count
    transformedData.sort((a, b) => b.cites - a.cites);
    
    console.log(`Transformed ${transformedData.length} citations`);
    setCitations(transformedData);
    
    // Update year range based on actual data
    const years = transformedData
      .map(c => c.year)
      .filter(year => typeof year === 'number');
    
    if (years.length > 0) {
      setYearRange([Math.min(...years), Math.max(...years)]);
    }
    
    setError(null);
  };
  
  // Set demo data (fallback)
  const setDemoData = () => {
    console.log("Setting up demo citation data");
    
    const mockCitations = [
      {
        id: 1,
        title: "Global Reconstruction of Naturalized River Flows at 2.94 Million Reaches",
        authors: "Lin, Peirong; Pan, Ming; Beck, Hylke E.; Yang, Yuan; Yamazaki, Dai",
        year: 2019,
        source: "Water Resources Research",
        publisher: "American Geophysical Union (AGU)",
        doi: "10.1029/2019WR025287",
        cites: 213,
        url: "https://agupubs.onlinelibrary.wiley.com/doi/10.1029/2019WR025287",
        engagement_level: "Level 3: Model Adaptation",
        research_domain: "River Modeling",
        watershed: "Global",
        country: "Global",
        isOriginalPaper: true,
        abstract: "Spatiotemporally continuous global river discharge estimates across the full spectrum of stream orders are vital to a range of hydrologic applications, yet they remain poorly constrained..."
      }
    ];
    
    setCitations(mockCitations);
    setLoading(false);
    setError("Using demo data based on provided research paper.");
  };

  // Get unique values for filter dropdowns
  const getUniqueValues = (field) => {
    const values = citations
      .map(c => c[field])
      .filter(v => v && v !== 'Unknown' && v !== 'Not specified' && v !== 'Not applicable')
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
    return values;
  };
  
  // Filter citations
  const filteredCitations = citations.filter(citation => {
    // Filter by search term
    const searchMatch = searchTerm === '' || [
      citation.title,
      citation.authors,
      citation.source,
      citation.publisher,
      citation.abstract,
      citation.doi,
      citation.research_domain,
      citation.watershed,
      citation.country
    ].some(field => 
      field && String(field).toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Filter by engagement level
    const engagementMatch = filterEngagement === 'all' || 
      citation.engagement_level === filterEngagement;
    
    // Filter by research domain
    const domainMatch = filterDomain.length === 0 || 
      filterDomain.includes(citation.research_domain);
    
    // Filter by watershed
    const watershedMatch = filterWatershed.length === 0 || 
      filterWatershed.includes(citation.watershed);
    
    // Filter by country
    const countryMatch = filterCountry === 'all' || 
      citation.country === filterCountry;
    
    // Filter by year
    const yearMatch = 
      (typeof citation.year === 'number') && 
      citation.year >= yearRange[0] && 
      citation.year <= yearRange[1];
    
    return searchMatch && engagementMatch && domainMatch && watershedMatch && countryMatch && 
           (typeof citation.year === 'number' ? yearMatch : true);
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
    if (['cites', 'year', 'referenceCount'].includes(sortField)) {
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
    const headers = [
      'Title', 'Authors', 'Year', 'Source', 'Publisher', 'DOI', 'Citations', 
      'Engagement Level', 'Research Domain', 'Watershed', 'Country', 
      'Volume', 'Issue', 'Pages', 'Reference Count'
    ];
    const rows = sortedCitations.map(c => [
      c.title, c.authors, c.year, c.source, c.publisher, c.doi, c.cites, 
      c.engagement_level, c.research_domain, c.watershed, c.country,
      c.volume, c.issue, c.pages, c.referenceCount
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
    link.setAttribute('download', 'crossref_citations.csv');
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
      : 0,
    totalReferences: citations.reduce((sum, citation) => sum + (citation.referenceCount || 0), 0),
    byEngagement: citations.reduce((acc, c) => {
      const level = c.engagement_level || 'Unknown';
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {}),
    byDomain: citations.reduce((acc, c) => {
      const domain = c.research_domain || 'Unknown';
      acc[domain] = (acc[domain] || 0) + 1;
      return acc;
    }, {})
  };
  
  return (
    <div className="bg-gray-100 min-h-screen">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center">
            <Link to="/science-model-dashboard/CARDAMOM" className="flex items-center text-blue-600 hover:text-blue-800 mr-6">
              <ArrowLeft size={18} className="mr-1" />
              <span className="font-medium">Back to Dashboard</span>
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Citation Analytics</h1>
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-sm text-purple-700 mb-1">Total References</div>
                  <div className="text-2xl font-bold text-purple-900">{citationStats.totalReferences}</div>
                </div>
              </div>
              
              {/* Engagement Level Distribution */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">By Engagement Level</div>
                        <div className="space-y-2">
                        {Object.entries(citationStats.byEngagement)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .slice(0, 5)
                          .map(([level, count]) => (
                          <div key={level} className="flex justify-between text-sm">
                          <span className="text-gray-600 truncate">{level}</span>
                          <span className="font-medium text-gray-900">{count}</span>
                          </div>
                        ))}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">By Research Domain</div>
                        <div className="space-y-2">
                        {Object.entries(citationStats.byDomain)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .slice(0, 5)
                          .map(([domain, count]) => (
                          <div key={domain} className="flex justify-between text-sm">
                          <span className="text-gray-600 truncate">{domain}</span>
                          <span className="font-medium text-gray-900">{count}</span>
                          </div>
                        ))}
                        </div>
                      </div>
                      </div>
                    </div>
                    
                    {/* Citation Table */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <div className="text-lg font-semibold text-gray-800">Research Publications</div>
                  <p className="text-sm text-gray-500 mt-1">
                    Academic publications with detailed metadata from Crossref
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Search input */}
                <div className="col-span-1 md:col-span-2 lg:col-span-1 relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search publications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                {/* Engagement Level Filter */}
                <div>
                  <select
                    value={filterEngagement}
                    onChange={(e) => setFilterEngagement(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="all">All Engagement Levels</option>
                    {getUniqueValues('engagement_level').map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
                
                {/* Research Domain Filter */}
                <div>
                  <MultiSelect
                    options={getUniqueValues('research_domain')}
                    selectedValues={filterDomain}
                    onChange={setFilterDomain}
                    placeholder="All Domains"
                  />
                </div>
                
                {/* Watershed Filter */}
                <div>
                  <MultiSelect
                    options={getUniqueValues('watershed')}
                    selectedValues={filterWatershed}
                    onChange={setFilterWatershed}
                    placeholder="All Watersheds"
                  />
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
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('engagement_level')}
                      >
                        <div className="flex items-center">
                          <span>Engagement</span>
                          {sortField === 'engagement_level' && (
                            sortDirection === 'asc' ? <SortAsc size={14} className="ml-1" /> : <SortDesc size={14} className="ml-1" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('research_domain')}
                      >
                        <div className="flex items-center">
                          <span>Domain</span>
                          {sortField === 'research_domain' && (
                            sortDirection === 'asc' ? <SortAsc size={14} className="ml-1" /> : <SortDesc size={14} className="ml-1" />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Journal Info
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Links
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedCitations.length > 0 ? sortedCitations.map((citation) => (
                      <tr key={citation.id} className={`hover:bg-gray-50 ${citation.isOriginalPaper ? 'bg-blue-50' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500 max-w-sm truncate" title={citation.title}>
                            {citation.title}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500 max-w-sm truncate" title={citation.authors}>
                            {citation.authors}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{citation.year}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{citation.cites}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs text-gray-600 max-w-32">
                            {citation.engagement_level.replace('Level ', 'L')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs text-gray-600 max-w-32 truncate" title={citation.research_domain}>
                            {citation.research_domain}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs text-gray-600 max-w-32">
                            <div className="truncate" title={citation.source}>{citation.source}</div>
                            {citation.volume && (
                              <div className="text-gray-400">
                                Vol. {citation.volume}
                                {citation.issue && `, No. ${citation.issue}`}
                                {citation.pages && `, pp. ${citation.pages}`}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            {citation.url && (
                              <div>
                                <a 
                                  href={citation.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 text-xs"
                                >
                                  View Article
                                </a>
                              </div>
                            )}
                            {citation.doi && (
                              <div>
                                <a 
                                  href={`https://doi.org/${citation.doi}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-green-600 hover:text-green-800 text-xs"
                                >
                                  DOI
                                </a>
                              </div>
                            )}
                            {citation.cites > 0 && citation.doi && (
                              <div>
                                <a 
                                  href={`https://scholar.google.com/scholar?cites=${citation.doi.replace('/', '%2F')}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-amber-600 hover:text-amber-800 text-xs"
                                >
                                  Citations
                                </a>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                          No publications match your search criteria
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
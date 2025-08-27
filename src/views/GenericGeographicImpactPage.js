// Generic Geographic Impact Page component that works with any model
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Filter, Map, Globe } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { getModelConfig } from '../config/modelConfig';
import InteractiveWorldMap from '../components/InteractiveWorldMap';

const GenericGeographicImpactPage = () => {
  const { modelName } = useParams();
  const modelConfig = getModelConfig(modelName);
  
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [watershedData, setWatershedData] = useState([]);
  const [countryData, setCountryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [citationsData, setCitationsData] = useState([]);
  
  useEffect(() => {
    loadModelData();
  }, [modelName]);
  
  // Load model-specific data
  const loadModelData = async () => {
    if (!modelConfig) {
      setError(`Model "${modelName}" not found`);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log(`Loading geographic data for ${modelConfig.displayName}`);
      
      // Dynamically import the model's JSON data
      const dataModule = await import(modelConfig.dataPath);
      const data = dataModule.default;
      setCitationsData(data);
      
      processGeographicData(data);
    } catch (error) {
      console.error('Error loading model data:', error);
      setError(`Error loading data for ${modelConfig.displayName}: ${error.message}`);
      setDemoData();
    } finally {
      setLoading(false);
    }
  };
  
  const processGeographicData = (data) => {
    try {
      // Filter out entries with meaningful watershed and country data
      const validEntries = data.filter(citation => 
        citation.watershed && 
        citation.country && 
        citation.watershed !== 'Unknown' && 
        citation.watershed !== 'Not specified' &&
        citation.watershed !== 'Not applicable' &&
        citation.country !== 'Unknown' && 
        citation.country !== 'Not specified' &&
        citation.country !== 'Not applicable'
      );
      
      // Group by watershed
      const watershedStats = {};
      validEntries.forEach(citation => {
        const watershed = citation.watershed;
        const country = citation.country;
        
        if (!watershedStats[watershed]) {
          watershedStats[watershed] = {
            name: watershed,
            countries: new Set(),
            papers: 0,
            citations: 0,
            domains: new Set(),
            engagementLevels: new Set(),
            years: []
          };
        }
        
        watershedStats[watershed].countries.add(country);
        watershedStats[watershed].papers += 1;
        
        // Handle citations data - check multiple possible field names
        const citationCount = citation['is-referenced-by-count'] || 
                             citation.cites || 
                             citation.citations || 
                             0;
        watershedStats[watershed].citations += citationCount;
        
        if (citation.research_domain) {
          watershedStats[watershed].domains.add(citation.research_domain);
        }
        if (citation.engagement_level) {
          watershedStats[watershed].engagementLevels.add(citation.engagement_level);
        }
        
        // Handle year data - check multiple possible sources
        let year = null;
        if (citation.year) {
          year = citation.year;
        } else if (citation.published && citation.published['date-parts'] && citation.published['date-parts'][0]) {
          year = citation.published['date-parts'][0][0];
        } else if (citation['published-online'] && citation['published-online']['date-parts'] && citation['published-online']['date-parts'][0]) {
          year = citation['published-online']['date-parts'][0][0];
        } else if (citation['published-print'] && citation['published-print']['date-parts'] && citation['published-print']['date-parts'][0]) {
          year = citation['published-print']['date-parts'][0][0];
        }
        
        if (year) {
          watershedStats[watershed].years.push(year);
        }
      });
      
      // Convert to array and add derived fields
      const watershedArray = Object.values(watershedStats).map(ws => ({
        ...ws,
        countries: Array.from(ws.countries).join(', '),
        domains: Array.from(ws.domains).join(', '),
        engagementLevels: Array.from(ws.engagementLevels).join(', '),
        firstYear: ws.years.length > 0 ? Math.min(...ws.years) : null,
        lastYear: ws.years.length > 0 ? Math.max(...ws.years) : null,
        avgCitations: ws.papers > 0 ? Math.round(ws.citations / ws.papers) : 0,
        yearRange: ws.years.length > 0 ? 
          (Math.min(...ws.years) === Math.max(...ws.years) ? 
            `${Math.min(...ws.years)}` : 
            `${Math.min(...ws.years)}-${Math.max(...ws.years)}`) : 
          'Unknown'
      }));
      
      // Sort by number of papers (descending)
      watershedArray.sort((a, b) => b.papers - a.papers);
      
      // Group by country
      const countryStats = {};
      validEntries.forEach(citation => {
        const country = citation.country;
        
        if (!countryStats[country]) {
          countryStats[country] = {
            name: country,
            papers: 0,
            citations: 0,
            watersheds: new Set(),
            domains: new Set(),
            years: []
          };
        }
        
        countryStats[country].papers += 1;
        
        const citationCount = citation['is-referenced-by-count'] || 
                             citation.cites || 
                             citation.citations || 
                             0;
        countryStats[country].citations += citationCount;
        
        if (citation.watershed) {
          countryStats[country].watersheds.add(citation.watershed);
        }
        if (citation.research_domain) {
          countryStats[country].domains.add(citation.research_domain);
        }
        
        // Handle year data
        let year = null;
        if (citation.year) {
          year = citation.year;
        } else if (citation.published && citation.published['date-parts'] && citation.published['date-parts'][0]) {
          year = citation.published['date-parts'][0][0];
        }
        
        if (year) {
          countryStats[country].years.push(year);
        }
      });
      
      // Convert to array and add derived fields
      const countryArray = Object.values(countryStats).map(cs => ({
        ...cs,
        watersheds: Array.from(cs.watersheds).join(', '),
        domains: Array.from(cs.domains).join(', '),
        avgCitations: cs.papers > 0 ? Math.round(cs.citations / cs.papers) : 0,
        firstYear: cs.years.length > 0 ? Math.min(...cs.years) : null,
        lastYear: cs.years.length > 0 ? Math.max(...cs.years) : null
      }));
      
      // Sort by number of papers (descending)
      countryArray.sort((a, b) => b.papers - a.papers);
      
      setWatershedData(watershedArray);
      setCountryData(countryArray);
      setError(null);
      
      console.log(`Processed geographic data: ${watershedArray.length} watersheds, ${countryArray.length} countries`);
      
    } catch (error) {
      console.error('Error processing geographic data:', error);
      setError(`Error processing geographic data: ${error.message}`);
      setDemoData();
    }
  };
  
  // Set demo data (fallback)
  const setDemoData = () => {
    console.log(`Setting up demo geographic data for ${modelConfig.displayName}`);
    
    const mockWatersheds = [
      {
        name: 'Example Basin',
        countries: 'Global',
        papers: 5,
        citations: 42,
        domains: modelConfig.domain || 'Unknown',
        engagementLevels: 'Level 2: Data Usage',
        firstYear: 2015,
        lastYear: 2023,
        avgCitations: 8,
        yearRange: '2015-2023'
      }
    ];
    
    const mockCountries = [
      {
        name: 'Global',
        papers: 5,
        citations: 42,
        watersheds: 'Example Basin',
        domains: modelConfig.domain || 'Unknown',
        avgCitations: 8,
        firstYear: 2015,
        lastYear: 2023
      }
    ];
    
    setWatershedData(mockWatersheds);
    setCountryData(mockCountries);
    setError(`Using demo geographic data for ${modelConfig.displayName}.`);
  };

  // Export data as CSV
  const exportWatershedCSV = () => {
    const headers = [
      'Watershed', 'Countries', 'Papers', 'Citations', 'Avg Citations', 
      'Research Domains', 'Engagement Levels', 'Year Range'
    ];
    const rows = watershedData.map(w => [
      w.name, w.countries, w.papers, w.citations, w.avgCitations,
      w.domains, w.engagementLevels, w.yearRange
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
    link.setAttribute('download', `${modelName}_watersheds.csv`);
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
            <h1 className="text-xl font-semibold text-gray-900">{modelConfig.displayName} Geographic Impact</h1>
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
              <p className="text-gray-600">Loading geographic data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Summary Statistics */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="text-lg font-semibold text-gray-800 mb-4">{modelConfig.displayName} Global Distribution</div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-blue-700 mb-1">Total Watersheds</div>
                  <div className="text-2xl font-bold text-blue-900">{watershedData.length}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm text-green-700 mb-1">Total Countries</div>
                  <div className="text-2xl font-bold text-green-900">{countryData.length}</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-4">
                  <div className="text-sm text-amber-700 mb-1">Total Applications</div>
                  <div className="text-2xl font-bold text-amber-900">
                    {watershedData.reduce((sum, w) => sum + w.papers, 0)}
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-sm text-purple-700 mb-1">Most Active Region</div>
                  <div className="text-lg font-bold text-purple-900">
                    {watershedData.length > 0 ? watershedData[0].name : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Interactive World Map */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-lg font-semibold text-gray-800">Global Applications Map</div>
                  <p className="text-sm text-gray-500 mt-1">
                    Geographic distribution of {modelConfig.displayName} applications and research
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Map size={18} className="text-gray-400" />
                  <span className="text-sm text-gray-600">Interactive Map</span>
                </div>
              </div>
              
              <div className="h-96 bg-gray-50 rounded-lg">
                <InteractiveWorldMap 
                  data={citationsData} 
                  modelName={modelConfig.displayName}
                />
              </div>
            </div>
            
            {/* Watershed Analysis */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <div className="text-lg font-semibold text-gray-800">Watershed Analysis</div>
                  <p className="text-sm text-gray-500 mt-1">
                    {modelConfig.displayName} applications by watershed and river basin
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={exportWatershedCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <Download size={16} />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Watershed/Basin
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Countries
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Papers
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Citations
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Research Domains
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time Period
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {watershedData.length > 0 ? watershedData.map((watershed, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{watershed.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500 max-w-xs truncate" title={watershed.countries}>
                            {watershed.countries}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{watershed.papers}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {watershed.citations}
                            <div className="text-xs text-gray-500">
                              ({watershed.avgCitations} avg)
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500 max-w-xs truncate" title={watershed.domains}>
                            {watershed.domains}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{watershed.yearRange}</div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                          No watershed data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Country Analysis */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-lg font-semibold text-gray-800 mb-4">Country Analysis</div>
              <p className="text-sm text-gray-500 mb-6">
                {modelConfig.displayName} applications by country and region
              </p>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Country/Region
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Papers
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Citations
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Watersheds
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Research Domains
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {countryData.length > 0 ? countryData.map((country, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{country.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{country.papers}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {country.citations}
                            <div className="text-xs text-gray-500">
                              ({country.avgCitations} avg)
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500 max-w-xs truncate" title={country.watersheds}>
                            {country.watersheds}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500 max-w-xs truncate" title={country.domains}>
                            {country.domains}
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                          No country data available
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

export default GenericGeographicImpactPage;
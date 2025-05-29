// src/views/GeographicImpactPage.js
// Page for showing geographical distribution of RAPID applications

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Filter, Map, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

// Import the JSON data directly
import citationsData from './rapid_20250528_2.json';

// Import the interactive map component
import InteractiveWorldMap from '../components/InteractiveWorldMap';

const GeographicImpactPage = () => {
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [watershedData, setWatershedData] = useState([]);
  const [countryData, setCountryData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    processGeographicData();
  }, []);
  
  const processGeographicData = () => {
    try {
      // Filter out entries with meaningful watershed and country data
      const validEntries = citationsData.filter(citation => 
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
            Math.min(...ws.years).toString() : 
            `${Math.min(...ws.years)}-${Math.max(...ws.years)}`) : 
          'N/A'
      })).sort((a, b) => b.papers - a.papers);
      
      setWatershedData(watershedArray);
      
      // Group by country
      const countryStats = {};
      validEntries.forEach(citation => {
        const countries = citation.country.split(/[,/]/).map(c => c.trim());
        
        countries.forEach(country => {
          if (!countryStats[country]) {
            countryStats[country] = {
              country: country,
              watersheds: new Set(),
              papers: 0,
              citations: 0,
              domains: new Set()
            };
          }
          
          countryStats[country].watersheds.add(citation.watershed);
          countryStats[country].papers += 1 / countries.length; // Split count for multi-country papers
          
          // Handle citations for countries
          const citationCount = citation['is-referenced-by-count'] || 
                               citation.cites || 
                               citation.citations || 
                               0;
          countryStats[country].citations += citationCount / countries.length;
          
          if (citation.research_domain) {
            countryStats[country].domains.add(citation.research_domain);
          }
        });
      });
      
      // Convert to array
      const countryArray = Object.values(countryStats).map(cs => ({
        ...cs,
        watersheds: cs.watersheds.size,
        papers: Math.round(cs.papers),
        citations: Math.round(cs.citations),
        domains: Array.from(cs.domains).join(', ')
      })).sort((a, b) => b.papers - a.papers);
      
      setCountryData(countryArray);
      setLoading(false);
      
    } catch (error) {
      console.error('Error processing geographic data:', error);
      setLoading(false);
    }
  };
  
  // Determine region for filtering
  const getRegion = (countries) => {
    const countryList = countries.toLowerCase();
    if (countryList.includes('usa') || countryList.includes('united states') || countryList.includes('canada') || countryList.includes('mexico')) {
      return 'north-america';
    }
    if (countryList.includes('france') || countryList.includes('germany') || countryList.includes('spain') || 
        countryList.includes('italy') || countryList.includes('uk') || countryList.includes('bulgaria') ||
        countryList.includes('europe')) {
      return 'europe';
    }
    if (countryList.includes('china') || countryList.includes('india') || countryList.includes('bangladesh') || 
        countryList.includes('nepal') || countryList.includes('cambodia')) {
      return 'asia';
    }
    if (countryList.includes('brazil') || countryList.includes('peru') || countryList.includes('colombia') || 
        countryList.includes('south america')) {
      return 'south-america';
    }
    if (countryList.includes('australia')) {
      return 'australia';
    }
    if (countryList.includes('africa')) {
      return 'africa';
    }
    return 'other';
  };
  
  // Filter watersheds by region
  const filteredWatersheds = selectedRegion === 'all' 
    ? watershedData 
    : watershedData.filter(w => getRegion(w.countries) === selectedRegion);
  
  // Calculate summary statistics
  const totalWatersheds = watershedData.length;
  const totalCountries = countryData.length;
  const totalPapers = watershedData.reduce((sum, w) => sum + w.papers, 0);
  const totalCitations = watershedData.reduce((sum, w) => sum + w.citations, 0);
  
  // Get timeline data
  const getTimelineData = () => {
    const yearStats = {};
    watershedData.forEach(ws => {
      if (ws.firstYear) {
        const year = ws.firstYear;
        if (!yearStats[year]) {
          yearStats[year] = { watersheds: [], count: 0 };
        }
        yearStats[year].watersheds.push(ws.name);
        yearStats[year].count += 1;
      }
    });
    
    return Object.entries(yearStats)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .slice(0, 6); // Show first 6 years
  };
  
  const timelineData = getTimelineData();
  
  // Handle region selection from map
  const handleMapRegionSelect = (countryName) => {
    // This could be enhanced to filter the table based on the selected country
    console.log('Selected country from map:', countryName);
  };
  
  // Export function
  const exportData = () => {
    const csvContent = [
      ['Watershed', 'Countries', 'Papers', 'Citations', 'Avg Citations', 'Research Domains', 'Years Active'].join(','),
      ...watershedData.map(w => [
        `"${w.name}"`,
        `"${w.countries}"`,
        w.papers,
        w.citations,
        w.avgCitations,
        `"${w.domains}"`,
        w.yearRange
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'rapid_geographic_impact.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (loading) {
    return (
      <div className="bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading geographic data...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-100 min-h-screen">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center">
            <Link to="/science-model-dashboard" className="flex items-center text-blue-600 hover:text-blue-800 mr-6">
              <ArrowLeft size={18} className="mr-1" />
              <span className="font-medium">Back to Dashboard</span>
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Geographic Impact of RAPID</h1>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Summary Card */}
          <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-3">
            <div className="flex flex-wrap items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Global Distribution of RAPID Applications</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Showing the watersheds and river basins where RAPID has been implemented and studied
                </p>
              </div>
              <div className="flex items-center space-x-4 mt-2 sm:mt-0">
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Globe size={16} className="text-gray-400" />
                  </div>
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="appearance-none pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="all">All Regions</option>
                    <option value="north-america">North America</option>
                    <option value="europe">Europe</option>
                    <option value="asia">Asia</option>
                    <option value="south-america">South America</option>
                    <option value="australia">Australia</option>
                    <option value="africa">Africa</option>
                  </select>
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                <button 
                  onClick={exportData}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <Download size={16} />
                  <span>Export Data</span>
                </button>
              </div>
            </div>
            
            <div className="flex flex-wrap text-center mb-6">
              <div className="w-full sm:w-1/2 lg:w-1/4 p-3">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-blue-700 mb-1">{totalWatersheds}</div>
                  <div className="text-sm text-blue-600">Watersheds Studied</div>
                </div>
              </div>
              <div className="w-full sm:w-1/2 lg:w-1/4 p-3">
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-green-700 mb-1">{totalCountries}</div>
                  <div className="text-sm text-green-600">Countries</div>
                </div>
              </div>
              <div className="w-full sm:w-1/2 lg:w-1/4 p-3">
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-purple-700 mb-1">{totalPapers}</div>
                  <div className="text-sm text-purple-600">Research Papers</div>
                </div>
              </div>
              <div className="w-full sm:w-1/2 lg:w-1/4 p-3">
                <div className="bg-amber-50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-amber-700 mb-1">{totalCitations.toLocaleString()}</div>
                  <div className="text-sm text-amber-600">Total Citations</div>
                </div>
              </div>
            </div>
            
            {/* Interactive Map */}
            <div className="mb-6">
              <InteractiveWorldMap 
                watershedData={watershedData}
                selectedRegion={selectedRegion}
                onRegionSelect={handleMapRegionSelect}
              />
            </div>
            
            {/* Watershed Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Watershed
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Country/Region
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Papers
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Citations
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Research Domains
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Years Active
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredWatersheds.map((watershed, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {watershed.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {watershed.countries}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {watershed.papers}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {watershed.citations.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={watershed.domains}>
                        {watershed.domains}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {watershed.yearRange}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Country Statistics Card */}
          <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Country Statistics</h2>
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Country
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Watersheds
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Papers
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Citations
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {countryData.slice(0, 15).map((countryItem, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {countryItem.country}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {countryItem.watersheds}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {countryItem.papers}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {countryItem.citations.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Application Timeline Card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Implementation Timeline</h2>
            <div className="space-y-6">
              <div className="relative">
                <div className="absolute top-0 bottom-0 left-4 w-0.5 bg-blue-200"></div>
                <div className="space-y-8">
                  {timelineData.map(([year, data], index) => (
                    <div key={year} className="relative pl-10">
                      <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                        {year}
                      </div>
                      <h3 className="text-base font-semibold text-gray-800">New Watersheds</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {data.watersheds.slice(0, 3).join(', ')}
                        {data.watersheds.length > 3 && `, +${data.watersheds.length - 3} more`}
                      </p>
                      <div className="mt-1 text-xs text-blue-600">{data.count} watershed{data.count > 1 ? 's' : ''}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">About the Geographic Impact Analysis</h2>
          <p className="text-sm text-gray-600 mb-4">
            This geographic impact analysis is automatically generated from {citationsData.length} research papers and citations 
            related to the RAPID (Routing Application for Parallel computatIon of Discharge) model. The data includes 
            watershed names, countries, research domains, and citation metrics extracted from the academic literature.
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Each watershed entry represents a unique combination of geographic location and research application documented 
            in the literature. The timeline shows the chronological expansion of RAPID applications across different 
            regions and research domains. Citation counts are extracted from the "is-referenced-by-count" field in the 
            academic database records.
          </p>
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            <div>📊 Data source: Academic citations and research papers</div>
            <div>🌍 Coverage: {totalWatersheds} watersheds across {totalCountries} countries</div>
            <div>📈 Total citations: {totalCitations.toLocaleString()}</div>
            <div>🗺️ Interactive map with zoom, pan, and hover details</div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GeographicImpactPage;
// src/views/GeographicImpactPage.js
// Page for showing geographical distribution of RAPID applications

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, MapPin, Globe2 } from 'lucide-react';
import { Link } from 'react-router-dom';

// Import the JSON data directly
import citationsData from '../data/RAPID_analyzed.json';

// Import Google Maps component
import GoogleMapComponent from '../components/GoogleMapComponent';

const GeographicImpactPage = () => {
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [regionData, setRegionData] = useState([]);
  const [countryData, setCountryData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Google Maps API key - should be set in environment variables
  const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  
  useEffect(() => {
    processGeographicData();
  }, []);
  
  // Helper function to extract country from affiliation string
  const extractCountryFromAffiliation = (affiliationName) => {
    if (!affiliationName) return null;
    
    // Common country patterns in affiliations
    const countryMappings = {
      'USA': 'United States',
      'US': 'United States',
      'United States': 'United States',
      'China': 'China',
      'France': 'France',
      'Germany': 'Germany',
      'UK': 'United Kingdom',
      'United Kingdom': 'United Kingdom',
      'Canada': 'Canada',
      'Australia': 'Australia',
      'Brazil': 'Brazil',
      'India': 'India',
      'Japan': 'Japan',
      'Italy': 'Italy',
      'Spain': 'Spain',
      'Netherlands': 'Netherlands',
      'Switzerland': 'Switzerland',
      'Sweden': 'Sweden',
      'Norway': 'Norway',
      'Denmark': 'Denmark',
      'Belgium': 'Belgium',
      'Austria': 'Austria',
      'Finland': 'Finland',
      'South Korea': 'South Korea',
      'Korea': 'South Korea',
      'Mexico': 'Mexico',
      'Argentina': 'Argentina',
      'Chile': 'Chile',
      'Peru': 'Peru'
    };
    
    // Try to match country patterns
    for (const [pattern, country] of Object.entries(countryMappings)) {
      if (affiliationName.includes(pattern)) {
        return country;
      }
    }
    
    return null;
  };

  // Helper function to extract region from country
  const getRegionFromCountry = (country) => {
    const regionMappings = {
      'United States': 'North America',
      'Canada': 'North America',
      'Mexico': 'North America',
      'China': 'Asia',
      'Japan': 'Asia',
      'South Korea': 'Asia',
      'India': 'Asia',
      'France': 'Europe',
      'Germany': 'Europe',
      'United Kingdom': 'Europe',
      'Italy': 'Europe',
      'Spain': 'Europe',
      'Netherlands': 'Europe',
      'Switzerland': 'Europe',
      'Sweden': 'Europe',
      'Norway': 'Europe',
      'Denmark': 'Europe',
      'Belgium': 'Europe',
      'Austria': 'Europe',
      'Finland': 'Europe',
      'Australia': 'Oceania',
      'Brazil': 'South America',
      'Argentina': 'South America',
      'Chile': 'South America',
      'Peru': 'South America'
    };
    
    return regionMappings[country] || 'Other';
  };

  const processGeographicData = () => {
    try {
      console.log('RAPID citations data loaded:', citationsData.length);
      console.log('First few entries:', citationsData.slice(0, 1));
      
      // Check what fields are available in the data
      if (citationsData.length > 0) {
        console.log('Sample entry fields:', Object.keys(citationsData[0]));
        console.log('Sample author structure:', citationsData[0].author?.slice(0, 1));
      }
      
      // Process each citation and extract geographic information from affiliations
      const entriesWithGeo = [];
      
      citationsData.forEach((citation, index) => {
        if (citation.author && Array.isArray(citation.author)) {
          // Extract countries from all authors' affiliations
          const countries = new Set();
          
          citation.author.forEach(author => {
            if (author.affiliation && Array.isArray(author.affiliation)) {
              author.affiliation.forEach(aff => {
                const country = extractCountryFromAffiliation(aff.name);
                if (country) {
                  countries.add(country);
                }
              });
            }
          });
          
          // If we found any countries, add to our processed data
          if (countries.size > 0) {
            const primaryCountry = Array.from(countries)[0]; // Use first country found
            const region = getRegionFromCountry(primaryCountry);
            
            entriesWithGeo.push({
              ...citation,
              country: primaryCountry,
              region: region,
              allCountries: Array.from(countries)
            });
          }
        }
      });
      
      console.log(`Extracted geographic data for ${entriesWithGeo.length} entries out of ${citationsData.length} total`);
      
      // Group by region
      const regionStats = {};
      entriesWithGeo.forEach(citation => {
        const region = citation.region;
        const country = citation.country;
        
        if (!regionStats[region]) {
          regionStats[region] = {
            name: region,
            countries: new Set(),
            papers: 0,
            citations: 0,
            domains: new Set(),
            engagementLevels: new Set(),
            years: []
          };
        }
        
        regionStats[region].countries.add(country);
        regionStats[region].papers += 1;
        
        // Handle citations data
        const citationCount = citation['is-referenced-by-count'] || 0;
        regionStats[region].citations += citationCount;
        
        if (citation.research_domain) {
          regionStats[region].domains.add(citation.research_domain);
        }
        if (citation.engagement_level) {
          regionStats[region].engagementLevels.add(citation.engagement_level);
        }
        
        // Handle year data
        let year = null;
        if (citation.published && citation.published['date-parts'] && citation.published['date-parts'][0]) {
          year = citation.published['date-parts'][0][0];
        }
        
        if (year) {
          regionStats[region].years.push(year);
        }
      });
      
      // Convert to array and add derived fields
      const regionArray = Object.values(regionStats).map(rs => ({
        ...rs,
        countries: Array.from(rs.countries).join(', '),
        domains: Array.from(rs.domains).join(', '),
        engagementLevels: Array.from(rs.engagementLevels).join(', '),
        firstYear: rs.years.length > 0 ? Math.min(...rs.years) : null,
        lastYear: rs.years.length > 0 ? Math.max(...rs.years) : null,
        avgCitations: rs.papers > 0 ? Math.round(rs.citations / rs.papers) : 0,
        yearRange: rs.years.length > 0 ? 
          (Math.min(...rs.years) === Math.max(...rs.years) ? 
            Math.min(...rs.years).toString() : 
            `${Math.min(...rs.years)}-${Math.max(...rs.years)}`) : 
          'N/A'
      })).sort((a, b) => b.papers - a.papers);
      
      setRegionData(regionArray);
      
      // Group by country
      const countryStats = {};
      entriesWithGeo.forEach(citation => {
        const country = citation.country;
        
        if (!countryStats[country]) {
          countryStats[country] = {
            country: country,
            regions: new Set(),
            papers: 0,
            citations: 0,
            domains: new Set()
          };
        }
        
        countryStats[country].regions.add(citation.region);
        countryStats[country].papers += 1;
        
        const citationCount = citation['is-referenced-by-count'] || 0;
        countryStats[country].citations += citationCount;
        
        if (citation.research_domain) {
          countryStats[country].domains.add(citation.research_domain);
        }
      });
      
      // Convert to array
      const countryArray = Object.values(countryStats).map(cs => ({
        ...cs,
        regions: cs.regions.size,
        papers: Math.round(cs.papers),
        citations: Math.round(cs.citations),
        domains: Array.from(cs.domains).join(', ')
      })).sort((a, b) => b.papers - a.papers);
      
      console.log('Final countryData to be set:', countryArray.slice(0, 5));
      setCountryData(countryArray);
      setLoading(false);
      
    } catch (error) {
      console.error('Error processing geographic data:', error);
      setLoading(false);
    }
  };
  
  // Calculate summary statistics
  const totalRegions = regionData.length;
  const totalCountries = countryData.length;
  const totalPapers = regionData.reduce((sum, r) => sum + r.papers, 0);
  const totalCitations = regionData.reduce((sum, r) => sum + r.citations, 0);
  
  if (loading) {
    return (
      <div className="bg-gray-100 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Processing geographic data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="text-blue-600 hover:text-blue-800">
                <ArrowLeft size={24} />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Geographic Impact Analysis</h1>
                <p className="text-gray-600 mt-1">RAPID model applications across different regions and countries</p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Download size={18} />
              Export Data
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Globe2 size={24} className="text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{totalRegions}</div>
                <div className="text-sm text-gray-500">Regions</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <MapPin size={24} className="text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{totalCountries}</div>
                <div className="text-sm text-gray-500">Countries</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <div className="w-6 h-6 bg-purple-600 rounded text-white text-xs flex items-center justify-center font-bold">P</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{totalPapers}</div>
                <div className="text-sm text-gray-500">Papers</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <div className="w-6 h-6 bg-orange-600 rounded text-white text-xs flex items-center justify-center font-bold">C</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{totalCitations.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Citations</div>
              </div>
            </div>
          </div>
        </div>

        {/* Google Map */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Global Distribution</h2>
          {GOOGLE_MAPS_API_KEY ? (
            <GoogleMapComponent data={countryData} apiKey={GOOGLE_MAPS_API_KEY} />
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Google Maps API Key Required
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      To display the interactive map, please set up your Google Maps API key in the environment variables.
                      Create a <code>.env</code> file and add <code>REACT_APP_GOOGLE_MAPS_API_KEY=your_key_here</code>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Regional Distribution */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Regional Distribution</h2>
            <div className="space-y-4">
              {regionData.slice(0, 10).map((region, index) => (
                <div key={index} className="border-b border-gray-100 pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">{region.name}</h3>
                    <div className="text-right">
                      <div className="text-sm font-medium text-blue-600">{region.papers} papers</div>
                      <div className="text-xs text-gray-500">{region.citations} citations</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div>Countries: {region.countries}</div>
                    <div>Years: {region.yearRange}</div>
                    <div>Avg Citations: {region.avgCitations}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Country Distribution */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Countries</h2>
            <div className="space-y-4">
              {countryData.slice(0, 10).map((country, index) => (
                <div key={index} className="border-b border-gray-100 pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">{country.country}</h3>
                    <div className="text-right">
                      <div className="text-sm font-medium text-blue-600">{country.papers} papers</div>
                      <div className="text-xs text-gray-500">{country.citations} citations</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div>Regions: {country.regions}</div>
                    <div>Domains: {country.domains.substring(0, 50)}{country.domains.length > 50 ? '...' : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeographicImpactPage;
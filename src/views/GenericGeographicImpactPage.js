// Generic Geographic Impact Page component that works with any model
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Map, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { getModelConfig } from '../config/modelConfig';
import GoogleMapComponent from '../components/GoogleMapComponent';
import MissionsSummary from '../components/MissionsSummary';

const GenericGeographicImpactPage = () => {
  const { modelName } = useParams();
  const modelConfig = getModelConfig(modelName);
  
  const [watershedData, setWatershedData] = useState([]);
  const [countryData, setCountryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [citationsData, setCitationsData] = useState([]);
  const [expandedRegion, setExpandedRegion] = useState(null);
  
  // Google Maps API key
  const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  
  useEffect(() => {
    loadModelData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      
      // Load the model's JSON data from public/data/, excluding Simple Citation
      const { loadModelData } = await import('../utils/dataLoader');
      const data = await loadModelData(modelName);
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

  const processGeographicData = (data) => {
    try {
      console.log(`${modelConfig.displayName} citations data loaded:`, data.length);

      // Process each citation and extract geographic information from affiliations or existing fields
      const entriesWithGeo = [];

      data.forEach((citation, index) => {
        let primaryCountry = null;
        let region = null;
        let allCountries = [];

        // Check if country/region already exist in the data (LES/EDMF format or enriched)
        if (citation.country &&
            citation.country !== 'Global' &&
            citation.country !== 'Not Geographic' &&
            citation.country !== 'Not Applicable') {
          primaryCountry = citation.country;
          region = citation.region &&
                   citation.region !== 'Global' &&
                   citation.region !== 'Not Geographic' &&
                   citation.region !== 'Not Applicable'
            ? citation.region
            : getRegionFromCountry(primaryCountry);
          // Use stored all_countries when available, otherwise just the primary
          allCountries = (citation.all_countries && citation.all_countries.length > 0)
            ? citation.all_countries
            : [primaryCountry];

          entriesWithGeo.push({
            ...citation,
            country: primaryCountry,
            region: region,
            allCountries: allCountries
          });
        }
        // Otherwise try to extract from author affiliations (Crossref format)
        else if (citation.author && Array.isArray(citation.author) && citation.author.length > 0 && typeof citation.author[0] === 'object') {
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
            primaryCountry = Array.from(countries)[0]; // Use first country found
            region = getRegionFromCountry(primaryCountry);

            entriesWithGeo.push({
              ...citation,
              country: primaryCountry,
              region: region,
              allCountries: Array.from(countries)
            });
          }
        }

        // Fallback: extract geographic info from title and abstract text
        if (!primaryCountry) {
          const title = Array.isArray(citation.title) ? citation.title[0] : (citation.title || '');
          const abstract = citation.abstract || '';
          const text = `${title} ${abstract}`;

          // Extended country/region keywords for text extraction
          const textGeoMappings = [
            { keywords: ['United States', 'USA', 'U.S.', 'American', 'Mississippi', 'Colorado River', 'Ohio River', 'Missouri River', 'Texas', 'California', 'Florida'], country: 'United States' },
            { keywords: ['China', 'Chinese', 'Yangtze', 'Yellow River', 'Pearl River'], country: 'China' },
            { keywords: ['France', 'French', 'Seine', 'Loire', 'Rhone'], country: 'France' },
            { keywords: ['Germany', 'German', 'Rhine', 'Danube'], country: 'Germany' },
            { keywords: ['United Kingdom', 'UK', 'British', 'England', 'Scotland', 'Wales', 'Thames'], country: 'United Kingdom' },
            { keywords: ['Canada', 'Canadian', 'St. Lawrence', 'Mackenzie'], country: 'Canada' },
            { keywords: ['Australia', 'Australian', 'Murray-Darling', 'Murray River'], country: 'Australia' },
            { keywords: ['Brazil', 'Brazilian', 'Amazon', 'Amazonas', 'São Francisco'], country: 'Brazil' },
            { keywords: ['India', 'Indian', 'Ganges', 'Ganga', 'Brahmaputra', 'Indus'], country: 'India' },
            { keywords: ['Japan', 'Japanese'], country: 'Japan' },
            { keywords: ['South Korea', 'Korea', 'Korean'], country: 'South Korea' },
            { keywords: ['Italy', 'Italian', 'Po River'], country: 'Italy' },
            { keywords: ['Spain', 'Spanish', 'Ebro', 'Tagus'], country: 'Spain' },
            { keywords: ['Netherlands', 'Dutch'], country: 'Netherlands' },
            { keywords: ['Switzerland', 'Swiss'], country: 'Switzerland' },
            { keywords: ['Sweden', 'Swedish'], country: 'Sweden' },
            { keywords: ['Norway', 'Norwegian'], country: 'Norway' },
            { keywords: ['Denmark', 'Danish'], country: 'Denmark' },
            { keywords: ['Belgium', 'Belgian'], country: 'Belgium' },
            { keywords: ['Austria', 'Austrian'], country: 'Austria' },
            { keywords: ['Finland', 'Finnish'], country: 'Finland' },
            { keywords: ['Mexico', 'Mexican'], country: 'Mexico' },
            { keywords: ['Argentina', 'Argentine', 'Paraná'], country: 'Argentina' },
            { keywords: ['Chile', 'Chilean'], country: 'Chile' },
            { keywords: ['Peru', 'Peruvian'], country: 'Peru' },
            { keywords: ['Africa', 'African', 'Nile', 'Congo River', 'Niger River', 'Zambezi'], country: 'Africa' },
            { keywords: ['Europe', 'European'], country: 'Europe' },
            { keywords: ['Asia', 'Asian'], country: 'Asia' }
          ];

          for (const mapping of textGeoMappings) {
            const found = mapping.keywords.some(keyword =>
              text.toLowerCase().includes(keyword.toLowerCase())
            );
            if (found) {
              primaryCountry = mapping.country;
              region = getRegionFromCountry(primaryCountry);
              // Handle continental-level entries
              if (primaryCountry === 'Africa') region = 'Africa';
              if (primaryCountry === 'Europe') region = 'Europe';
              if (primaryCountry === 'Asia') region = 'Asia';

              entriesWithGeo.push({
                ...citation,
                country: primaryCountry,
                region: region,
                allCountries: [primaryCountry]
              });
              break;
            }
          }
        }
      });

      console.log(`Extracted geographic data for ${entriesWithGeo.length} entries out of ${data.length} total`);
      
      // Group by primary region; also collect all countries from allCountries for display
      const regionStats = {};
      entriesWithGeo.forEach(citation => {
        const primaryRegion = citation.region;
        if (!primaryRegion) return;

        if (!regionStats[primaryRegion]) {
          regionStats[primaryRegion] = {
            name: primaryRegion,
            countries: new Set(),
            papers: 0,
            citations: 0,
            domains: new Set(),
            engagementLevels: new Set(),
            years: [],
            papersList: []
          };
        }

        // Add ALL countries (from allCountries) that map to this region
        const allC = (citation.allCountries && citation.allCountries.length > 0)
          ? citation.allCountries
          : [citation.country];
        allC.forEach(c => {
          if (getRegionFromCountry(c) === primaryRegion) {
            regionStats[primaryRegion].countries.add(c);
          }
        });
        // Always add primary country too
        regionStats[primaryRegion].countries.add(citation.country);

        regionStats[primaryRegion].papers += 1;
        regionStats[primaryRegion].papersList.push(citation);

        const citationCount = citation['is-referenced-by-count'] ||
                             citation.citation_count ||
                             citation.cites ||
                             citation.citations ||
                             0;
        regionStats[primaryRegion].citations += citationCount;

        if (citation.research_domain) {
          regionStats[primaryRegion].domains.add(citation.research_domain);
        }
        if (citation.engagement_level) {
          regionStats[primaryRegion].engagementLevels.add(citation.engagement_level);
        }

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
          regionStats[primaryRegion].years.push(year);
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
            `${Math.min(...rs.years)}` :
            `${Math.min(...rs.years)}-${Math.max(...rs.years)}`) :
          'Unknown',
        papersList: rs.papersList
      }));
      
      // Sort by number of papers (descending)
      regionArray.sort((a, b) => b.papers - a.papers);
      
      // Group by country — multi-country papers count under each of their countries
      const countryStats = {};
      entriesWithGeo.forEach(citation => {
        const citationCount = citation['is-referenced-by-count'] ||
                             citation.citation_count ||
                             citation.cites ||
                             citation.citations ||
                             0;
        let year = null;
        if (citation.year) {
          year = citation.year;
        } else if (citation.published && citation.published['date-parts'] && citation.published['date-parts'][0]) {
          year = citation.published['date-parts'][0][0];
        }

        // Use all_countries if available, otherwise just the primary country
        const countries = (citation.allCountries && citation.allCountries.length > 0)
          ? citation.allCountries
          : [citation.country];

        countries.forEach(country => {
          if (!country) return;
          if (!countryStats[country]) {
            countryStats[country] = {
              country: country,
              papers: 0,
              citations: 0,
              regions: new Set(),
              domains: new Set(),
              years: [],
              papersList: []
            };
          }
          countryStats[country].papers += 1;
          countryStats[country].citations += citationCount;
          const r = getRegionFromCountry(country);
          if (r) countryStats[country].regions.add(r);
          if (citation.research_domain) countryStats[country].domains.add(citation.research_domain);
          if (year) countryStats[country].years.push(year);
          // Only add to papersList once per unique paper (avoid duplicates from multi-country)
          if (!countryStats[country].papersList.includes(citation)) {
            countryStats[country].papersList.push(citation);
          }
        });
      });

      // Convert to array and add derived fields
      const countryArray = Object.values(countryStats).map(cs => ({
        ...cs,
        region: Array.from(cs.regions)[0] || 'Other',
        regions: Array.from(cs.regions).join(', '),
        domains: Array.from(cs.domains).join(', '),
        avgCitations: cs.papers > 0 ? Math.round(cs.citations / cs.papers) : 0,
        firstYear: cs.years.length > 0 ? Math.min(...cs.years) : null,
        lastYear: cs.years.length > 0 ? Math.max(...cs.years) : null,
        yearRange: cs.years.length > 0
          ? (Math.min(...cs.years) === Math.max(...cs.years)
              ? `${Math.min(...cs.years)}`
              : `${Math.min(...cs.years)}–${Math.max(...cs.years)}`)
          : 'Unknown',
        papersList: cs.papersList
      }));

      // Sort by number of papers (descending)
      countryArray.sort((a, b) => b.papers - a.papers);
      
      setWatershedData(regionArray);
      setCountryData(countryArray);
      setError(null);
      
      console.log(`Processed geographic data: ${regionArray.length} regions, ${countryArray.length} countries`);
      
    } catch (error) {
      console.error('Error processing geographic data:', error);
      setError(`Error processing geographic data: ${error.message}`);
      setDemoData();
    }
  };
  
  // Set demo data (fallback)
  const setDemoData = () => {
    console.log(`Setting up demo geographic data for ${modelConfig.displayName}`);
    
    const mockRegions = [
      {
        name: 'Example Region',
        countries: 'Global',
        papers: 5,
        citations: 42,
        domains: modelConfig.domain || 'Unknown',
        engagementLevels: 'Level 1: Data Usage',
        firstYear: 2015,
        lastYear: 2023,
        avgCitations: 8,
        yearRange: '2015-2023'
      }
    ];
    
    const mockCountries = [
      {
        country: 'Global',
        papers: 5,
        citations: 42,
        regions: 'Example Region',
        domains: modelConfig.domain || 'Unknown',
        avgCitations: 8,
        firstYear: 2015,
        lastYear: 2023
      }
    ];
    
    setWatershedData(mockRegions);
    setCountryData(mockCountries);
    setError(`Using demo geographic data for ${modelConfig.displayName}.`);
  };

  // Export data as CSV
  const exportWatershedCSV = () => {
    const headers = [
      'Region', 'Countries', 'Papers', 'Citations', 'Avg Citations', 
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
    link.setAttribute('download', `${modelName}_regions.csv`);
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
            <Link to={`/${modelName}`} className="flex items-center text-blue-600 hover:text-blue-800 mr-6">
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
              <div className="text-lg font-semibold text-gray-800 mb-1">{modelConfig.displayName} Global Distribution</div>
              <p className="text-xs text-gray-500 mb-4">
                Country attribution is based on the first author's institution affiliation, retrieved from Crossref metadata.
                Papers with multi-country author teams are counted once under the first author's country.
                Papers where institution data is unavailable fall back to geographic keywords in the title/abstract.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-blue-700 mb-1">Total Regions</div>
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
                  <div className="text-sm text-purple-700 mb-1">Most Active Country</div>
                  <div className="text-lg font-bold text-purple-900">
                    {countryData.length > 0 ? countryData[0].country : 'N/A'}
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
                {GOOGLE_MAPS_API_KEY ? (
                  <GoogleMapComponent
                    data={countryData}
                    regionalData={watershedData}
                    apiKey={GOOGLE_MAPS_API_KEY}
                    citationsData={citationsData}
                  />
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-yellow-800 font-medium mb-2">Google Maps API Key Required</div>
                      <div className="text-yellow-700 text-sm">
                        To display the interactive map, please set up your Google Maps API key in the environment variables.
                        Create a <code className="bg-yellow-100 px-1 rounded">.env</code> file and add <code className="bg-yellow-100 px-1 rounded">REACT_APP_GOOGLE_MAPS_API_KEY=your_key_here</code>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Geographic Analysis — merged country + region table */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div>
                  <div className="text-lg font-semibold text-gray-800">Geographic Analysis</div>
                  <p className="text-sm text-gray-500 mt-1">
                    {modelConfig.displayName} applications by country and region — click a row to see papers
                  </p>
                </div>
                <button
                  onClick={exportWatershedCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shrink-0"
                >
                  <Download size={16} />
                  <span>Export CSV</span>
                </button>
              </div>
              <p className="text-xs text-gray-400 mb-5">
                Country is based on first-author institution (Crossref / OpenAlex). Multi-national papers are counted under each of their countries.
                ~{Math.round((1 - countryData.reduce((s,c)=>s+c.papers,0)/Math.max(citationsData.length,1))*100)}% of papers lack institution metadata and are excluded.
              </p>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">Country</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Region</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Papers</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Citations</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Research Domains</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Time Period</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {countryData.length > 0 ? countryData.map((entry, index) => {
                      const isExpanded = expandedRegion === entry.country;
                      return (
                        <React.Fragment key={index}>
                          <tr
                            className="hover:bg-gray-50 cursor-pointer select-none"
                            onClick={() => setExpandedRegion(isExpanded ? null : entry.country)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                {isExpanded ? <ChevronDown size={14} className="text-gray-400 shrink-0" /> : <ChevronRight size={14} className="text-gray-400 shrink-0" />}
                                <span className="text-sm font-medium text-gray-900">{entry.country}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">{entry.region}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{entry.papers}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {entry.citations}
                                <div className="text-xs text-gray-500">({entry.avgCitations} avg)</div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-500 max-w-xs truncate" title={entry.domains}>{entry.domains}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{entry.yearRange}</div>
                            </td>
                          </tr>
                          {isExpanded && entry.papersList && entry.papersList.length > 0 && (
                            <tr>
                              <td colSpan="6" className="px-0 py-0 bg-blue-50 border-b border-blue-100">
                                <div className="px-6 py-4">
                                  <div className="text-xs font-semibold text-blue-700 mb-3 uppercase tracking-wide">
                                    Papers — {entry.country} ({entry.papersList.length})
                                  </div>
                                  <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {entry.papersList
                                      .slice()
                                      .sort((a, b) => {
                                        const ca = a['is-referenced-by-count'] || a.citation_count || 0;
                                        const cb = b['is-referenced-by-count'] || b.citation_count || 0;
                                        return cb - ca;
                                      })
                                      .map((paper, pi) => {
                                        const title = Array.isArray(paper.title) ? paper.title[0] : (paper.title || 'Untitled');
                                        const doi = paper.DOI || paper.doi;
                                        const url = paper.URL || paper.url || (doi ? `https://doi.org/${doi}` : null);
                                        const year = paper.year || (paper['published-print'] && paper['published-print']['date-parts'] && paper['published-print']['date-parts'][0] && paper['published-print']['date-parts'][0][0]);
                                        const allPaperCountries = (paper.allCountries && paper.allCountries.length > 0)
                                          ? paper.allCountries : (paper.country ? [paper.country] : []);
                                        const countryDisplay = allPaperCountries.length > 3
                                          ? allPaperCountries.slice(0, 3).join(', ') + ` +${allPaperCountries.length - 3} more`
                                          : allPaperCountries.join(', ') || entry.country;
                                        const institutions = paper.institutions;
                                        const firstInstitution = Array.isArray(institutions) ? institutions[0] : (typeof institutions === 'string' ? institutions : null);
                                        const citCount = paper['is-referenced-by-count'] || paper.citation_count || 0;
                                        const engagementLevel = paper.engagement_level;
                                        return (
                                          <div key={pi} className="bg-white rounded-lg p-3 border border-blue-100 text-xs">
                                            <div className="flex items-start justify-between gap-2">
                                              <div className="flex-1 min-w-0">
                                                {url ? (
                                                  <a href={url} target="_blank" rel="noopener noreferrer"
                                                    className="font-medium text-blue-700 hover:text-blue-900 hover:underline flex items-start gap-1"
                                                    onClick={e => e.stopPropagation()}
                                                  >
                                                    <ExternalLink size={11} className="mt-0.5 shrink-0" />
                                                    <span>{title}{year ? ` (${year})` : ''}</span>
                                                  </a>
                                                ) : (
                                                  <span className="font-medium text-gray-800">{title}{year ? ` (${year})` : ''}</span>
                                                )}
                                                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-gray-500">
                                                  {firstInstitution && (
                                                    <span className="flex items-center gap-1">
                                                      <span className="font-medium text-gray-600">Institution:</span> {firstInstitution}
                                                    </span>
                                                  )}
                                                  {allPaperCountries.length > 0 && (
                                                    <span className="flex items-center gap-1">
                                                      <span className="font-medium text-gray-600">{allPaperCountries.length > 1 ? 'Countries' : 'Country'}:</span>
                                                      <span title={allPaperCountries.join(', ')}>{countryDisplay}</span>
                                                    </span>
                                                  )}
                                                  {engagementLevel && (
                                                    <span className="flex items-center gap-1">
                                                      <span className="font-medium text-gray-600">Engagement:</span> {engagementLevel}
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                              {citCount > 0 && (
                                                <div className="shrink-0 text-right text-gray-400">
                                                  <div className="font-semibold text-gray-600">{citCount}</div>
                                                  <div>cites</div>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    }) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No geographic data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Missions & Instruments Used */}
            <div className="mt-6">
              <MissionsSummary
                citationsData={citationsData}
                maxMissions={10}
                showDetails={true}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default GenericGeographicImpactPage;
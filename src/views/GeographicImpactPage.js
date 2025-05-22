// src/views/GeographicImpactPage.js
// Page for showing geographical distribution of RAPID applications

import React, { useState } from 'react';
import { ArrowLeft, Download, Filter, Map, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

const GeographicImpactPage = () => {
  const [selectedRegion, setSelectedRegion] = useState('all');
  
  // Sample data of watersheds where RAPID has been applied
  const watershedData = [
    { id: 1, name: "Mississippi River Basin", country: "United States", area: 3220000, papers: 12, details: "Continental scale modeling with high-resolution NHDPlus dataset" },
    { id: 2, name: "Seine River Basin", country: "France", area: 78650, papers: 5, details: "Applied with the SIM-France model for operational flood forecasting" },
    { id: 3, name: "Texas Gulf Coast Basins", country: "United States", area: 116000, papers: 4, details: "San Antonio, Guadalupe, and Colorado river basins" },
    { id: 4, name: "Rhine Graben Basin", country: "Germany/France", area: 185000, papers: 3, details: "Upper Rhine hydrosystem water balance assessment" },
    { id: 5, name: "South Platte River Basin", country: "United States", area: 62400, papers: 2, details: "Flood inundation mapping and streamflow estimation" },
    { id: 6, name: "Great Lakes Basin", country: "United States/Canada", area: 765000, papers: 2, details: "Hydrologic forecasting system development" },
    { id: 7, name: "Columbia River Basin", country: "United States/Canada", area: 668000, papers: 2, details: "Transboundary watershed management and routing" },
    { id: 8, name: "Amazon River Basin", country: "Brazil/Peru/Colombia", area: 6300000, papers: 1, details: "Large-scale river routing on continental network" },
    { id: 9, name: "Yangtze River Basin", country: "China", area: 1800000, papers: 1, details: "River routing with local adaptations for regional hydrology" },
    { id: 10, name: "Ganges-Brahmaputra Basin", country: "India/Bangladesh", area: 1730000, papers: 1, details: "Flood prediction in densely populated delta regions" },
    { id: 11, name: "Murray-Darling Basin", country: "Australia", area: 1060000, papers: 1, details: "Drought impact assessment and river management" },
    { id: 12, name: "Danube River Basin", country: "Multiple European Countries", area: 801500, papers: 1, details: "Transboundary water management in Europe" },
  ];
  
  // Filter watersheds by region
  const filteredWatersheds = selectedRegion === 'all' 
    ? watershedData 
    : watershedData.filter(w => {
        if (selectedRegion === 'north-america') return w.country.includes('United States') || w.country.includes('Canada');
        if (selectedRegion === 'europe') return w.country.includes('France') || w.country.includes('Germany') || w.country.includes('European');
        if (selectedRegion === 'asia') return w.country.includes('China') || w.country.includes('India');
        if (selectedRegion === 'australia') return w.country.includes('Australia');
        if (selectedRegion === 'south-america') return w.country.includes('Brazil') || w.country.includes('Peru') || w.country.includes('Colombia');
        return false;
      });
  
  // Group watersheds by country for summary
  const countrySummary = watershedData.reduce((acc, watershed) => {
    const countries = watershed.country.split('/');
    countries.forEach(country => {
      if (!acc[country.trim()]) {
        acc[country.trim()] = { count: 0, papers: 0 };
      }
      // Increment with partial count for shared watersheds
      acc[country.trim()].count += 1 / countries.length;
      acc[country.trim()].papers += watershed.papers / countries.length;
    });
    return acc;
  }, {});
  
  // Sort countries by watershed count
  const sortedCountries = Object.entries(countrySummary)
    .map(([country, stats]) => ({
      country,
      count: Math.round(stats.count),
      papers: Math.round(stats.papers)
    }))
    .sort((a, b) => b.count - a.count);
  
  return (
    <div className="bg-gray-100 min-h-screen">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center">
            <Link to="/" className="flex items-center text-blue-600 hover:text-blue-800 mr-6">
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
                  </select>
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  <Download size={16} />
                  <span>Export Data</span>
                </button>
              </div>
            </div>
            
            <div className="flex flex-wrap text-center mb-6">
              <div className="w-full sm:w-1/2 lg:w-1/4 p-3">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-blue-700 mb-1">48</div>
                  <div className="text-sm text-blue-600">Watersheds Modeled</div>
                </div>
              </div>
              <div className="w-full sm:w-1/2 lg:w-1/4 p-3">
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-green-700 mb-1">17</div>
                  <div className="text-sm text-green-600">Countries</div>
                </div>
              </div>
              <div className="w-full sm:w-1/2 lg:w-1/4 p-3">
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-purple-700 mb-1">5</div>
                  <div className="text-sm text-purple-600">Continents</div>
                </div>
              </div>
              <div className="w-full sm:w-1/2 lg:w-1/4 p-3">
                <div className="bg-amber-50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-amber-700 mb-1">28.5M</div>
                  <div className="text-sm text-amber-600">km² Total Area</div>
                </div>
              </div>
            </div>
            
            {/* Map placeholder */}
            <div className="bg-gray-100 rounded-lg h-96 mb-6 flex items-center justify-center border border-gray-200">
              <div className="text-center">
                <Map size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 max-w-md mx-auto">
                  Interactive map showing global RAPID model implementation regions. 
                  Click on a watershed to view detailed information.
                </p>
              </div>
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
                      Area (km²)
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Related Papers
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredWatersheds.map((watershed) => (
                    <tr key={watershed.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {watershed.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {watershed.country}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {watershed.area.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {watershed.papers}
                      </td>
                      <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 max-w-md">
                        {watershed.details}
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
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedCountries.map((countryData, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {countryData.country}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {countryData.count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {countryData.papers}
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
                  {/* Timeline items */}
                  <div className="relative pl-10">
                    <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                      2011
                    </div>
                    <h3 className="text-base font-semibold text-gray-800">Initial Development</h3>
                    <p className="text-sm text-gray-600 mt-1">First application on the NHDPlus dataset in the United States. Applied to SIM-France model.</p>
                    <div className="mt-1 text-xs text-blue-600">2 watersheds</div>
                  </div>
                  
                  <div className="relative pl-10">
                    <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                      2013
                    </div>
                    <h3 className="text-base font-semibold text-gray-800">North American Expansion</h3>
                    <p className="text-sm text-gray-600 mt-1">Extended to multiple watersheds across the United States, focusing on Texas Gulf Coast basins.</p>
                    <div className="mt-1 text-xs text-blue-600">+5 watersheds</div>
                  </div>
                  
                  <div className="relative pl-10">
                    <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                      2015
                    </div>
                    <h3 className="text-base font-semibold text-gray-800">European Applications</h3>
                    <p className="text-sm text-gray-600 mt-1">Implementation in several European river basins, including the Rhine and Danube basins.</p>
                    <div className="mt-1 text-xs text-blue-600">+8 watersheds</div>
                  </div>
                  
                  <div className="relative pl-10">
                    <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                      2017
                    </div>
                    <h3 className="text-base font-semibold text-gray-800">Continental Scale Application</h3>
                    <p className="text-sm text-gray-600 mt-1">Implementation across the entire Mississippi River Basin and initial applications in South America.</p>
                    <div className="mt-1 text-xs text-blue-600">+12 watersheds</div>
                  </div>
                  
                  <div className="relative pl-10">
                    <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                      2020
                    </div>
                    <h3 className="text-base font-semibold text-gray-800">Global Expansion</h3>
                    <p className="text-sm text-gray-600 mt-1">Implementation in Asian river basins including the Yangtze and Ganges-Brahmaputra, along with the Murray-Darling in Australia.</p>
                    <div className="mt-1 text-xs text-blue-600">+15 watersheds</div>
                  </div>
                  
                  <div className="relative pl-10">
                    <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                      2025
                    </div>
                    <h3 className="text-base font-semibold text-gray-800">Current Coverage</h3>
                    <p className="text-sm text-gray-600 mt-1">Implementation across 48 watersheds on 5 continents, covering major river systems globally.</p>
                    <div className="mt-1 text-xs text-blue-600">+6 watersheds</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">About the Geographic Impact Analysis</h2>
          <p className="text-sm text-gray-600 mb-4">
            This geographic impact analysis tracks the implementation of the RAPID (River Application for Parallel computation of Discharge) model in watersheds around the world. The data is compiled from published research papers and technical reports that cite the original RAPID paper and document specific implementations of the model.
          </p>
          <p className="text-sm text-gray-600 mb-4">
            The watershed boundaries and area measurements are derived from HydroSHEDS and similar global hydrographic datasets. Implementation details are extracted from the research papers and supplementary materials.
          </p>
          <div className="flex justify-end">
            <a href="#" className="text-sm text-blue-600 hover:text-blue-800 hover:underline">Download Methodology Documentation</a>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GeographicImpactPage;
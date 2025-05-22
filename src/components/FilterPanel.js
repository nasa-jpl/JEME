// src/components/FilterPanel.js
// Filter panel component for dashboard filters

import React, { useState } from 'react';
import { Filter, X, Check, Calendar } from 'lucide-react';

const FilterPanel = ({ onApplyFilters, initialFilters = {} }) => {
  // Initialize filter state with defaults or provided initial values
  const [filters, setFilters] = useState({
    yearRange: initialFilters.yearRange || [2011, 2025],
    citationType: initialFilters.citationType || 'all',
    researchDomain: initialFilters.researchDomain || 'all',
    engagementLevel: initialFilters.engagementLevel || 'all',
    ...initialFilters
  });
  
  // Citation type options
  const citationTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'peer-reviewed', label: 'Peer-Reviewed Journals' },
    { value: 'conference', label: 'Conference Papers' },
    { value: 'thesis', label: 'Academic Theses' },
    { value: 'technical', label: 'Technical Reports' },
    { value: 'online', label: 'Online Resources' },
    { value: 'popular', label: 'Popular Press' }
  ];
  
  // Research domain options
  const researchDomains = [
    { value: 'all', label: 'All Domains' },
    { value: 'river-modeling', label: 'River Modeling' },
    { value: 'water-resources', label: 'Water Resources' },
    { value: 'flow-analysis', label: 'Flow Analysis' },
    { value: 'flood-prediction', label: 'Flood Prediction' },
    { value: 'streamflow', label: 'Streamflow' }
  ];
  
  // Engagement level options
  const engagementLevels = [
    { value: 'all', label: 'All Levels' },
    { value: 'level-1', label: 'Level 1: Simple Citation' },
    { value: 'level-2', label: 'Level 2: Data Usage' },
    { value: 'level-3', label: 'Level 3: Model Adaptation' },
    { value: 'level-4', label: 'Level 4: Foundation' }
  ];
  
  // Handle filter change
  const handleFilterChange = (filterType, value) => {
    setFilters({
      ...filters,
      [filterType]: value
    });
  };
  
  // Handle year range change
  const handleYearChange = (index, value) => {
    const newYearRange = [...filters.yearRange];
    newYearRange[index] = parseInt(value);
    setFilters({
      ...filters,
      yearRange: newYearRange
    });
  };
  
  // Handle apply filters
  const handleApply = () => {
    if (onApplyFilters) {
      onApplyFilters(filters);
    }
  };
  
  // Handle reset filters
  const handleReset = () => {
    setFilters({
      yearRange: [2011, 2025],
      citationType: 'all',
      researchDomain: 'all',
      engagementLevel: 'all'
    });
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-5 mb-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <Filter size={18} className="text-gray-500 mr-2" />
          <div className="text-base font-semibold text-gray-800">Filter Dashboard</div>
        </div>
        <button 
          onClick={handleReset} 
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
        >
          <X size={14} className="mr-1" />
          <span>Reset Filters</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Year Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Year Range
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="2011"
              max="2025"
              value={filters.yearRange[0]}
              onChange={(e) => handleYearChange(0, e.target.value)}
              className="w-24 py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="text-gray-500">to</span>
            <input
              type="number"
              min="2011"
              max="2025"
              value={filters.yearRange[1]}
              onChange={(e) => handleYearChange(1, e.target.value)}
              className="w-24 py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        {/* Citation Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Citation Type
          </label>
          <select
            value={filters.citationType}
            onChange={(e) => handleFilterChange('citationType', e.target.value)}
            className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {citationTypes.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
        
        {/* Research Domain Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Research Domain
          </label>
          <select
            value={filters.researchDomain}
            onChange={(e) => handleFilterChange('researchDomain', e.target.value)}
            className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {researchDomains.map((domain) => (
              <option key={domain.value} value={domain.value}>{domain.label}</option>
            ))}
          </select>
        </div>
        
        {/* Engagement Level Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Engagement Level
          </label>
          <select
            value={filters.engagementLevel}
            onChange={(e) => handleFilterChange('engagementLevel', e.target.value)}
            className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {engagementLevels.map((level) => (
              <option key={level.value} value={level.value}>{level.label}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Additional filters section (collapsed by default) */}
      <div className="border-t border-gray-200 pt-4 mt-2">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="peerReviewedOnly"
              checked={filters.peerReviewedOnly || false}
              onChange={(e) => handleFilterChange('peerReviewedOnly', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor="peerReviewedOnly" className="text-sm text-gray-700">
              Peer-reviewed only
            </label>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="hasDoiOnly"
              checked={filters.hasDoiOnly || false}
              onChange={(e) => handleFilterChange('hasDoiOnly', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor="hasDoiOnly" className="text-sm text-gray-700">
              Has DOI only
            </label>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="highImpactOnly"
              checked={filters.highImpactOnly || false}
              onChange={(e) => handleFilterChange('highImpactOnly', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor="highImpactOnly" className="text-sm text-gray-700">
              High-impact journals only
            </label>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="excludeOnlineResources"
              checked={filters.excludeOnlineResources || false}
              onChange={(e) => handleFilterChange('excludeOnlineResources', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor="excludeOnlineResources" className="text-sm text-gray-700">
              Exclude online resources
            </label>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end mt-6">
        <button 
          onClick={handleApply}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 rounded-md"
        >
          <Check size={16} />
          <span>Apply Filters</span>
        </button>
      </div>
    </div>
  );
};

export default FilterPanel;
// src/views/ResearchDomainsPage.js
// Page for analyzing research domains where RAPID has been applied

import React, { useState } from 'react';
import { ArrowLeft, Download, Filter, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import domainData from '../data/domainData';

const ResearchDomainsPage = () => {
  const [selectedDomain, setSelectedDomain] = useState('all');
  
  // Extended research domain keywords for analysis
  const domainKeywords = {
    'River Modeling': ['river', 'routing', 'channel', 'network', 'stream', 'hydraulic'],
    'Water Resources': ['water', 'resources', 'hydro', 'reservoir', 'management', 'supply'],
    'Flow Analysis': ['flow', 'discharge', 'runoff', 'streamflow', 'velocity', 'volume'],
    'Flood Prediction': ['flood', 'inundation', 'prediction', 'forecast', 'warning', 'risk'],
    'Streamflow': ['streamflow', 'stream', 'measurement', 'gauge', 'monitoring', 'velocity']
  };
  
  // Sample data of papers categorized by research domain
  const papersByDomain = [
    {
      title: "Continental Scale River Flow Modeling of the Mississippi River Basin Using High-Resolution NHDPlus Dataset",
      authors: "Ahmad A. Tavakoly, Alan D. Snow, Cédric H. David, Michael L. Follum, David R. Maidment, Zong-Liang Yang",
      year: 2016,
      domains: ["River Modeling", "Flow Analysis"],
      keywords: ["continental modeling", "NHDPlus", "river network", "discharge"],
      abstract: "This study applies the RAPID model to the entire Mississippi River Basin using high-resolution NHDPlus dataset, demonstrating the capabilities of large-scale river flow modeling."
    },
    {
      title: "Development and evaluation of a physically-based lake level model for water resource management",
      authors: "Peirong Lin, Zong-Liang Yang, Xitian Cai, Cédric H. David",
      year: 2015,
      domains: ["Water Resources", "River Modeling"],
      keywords: ["lake level", "water resource", "management", "reservoir"],
      abstract: "This paper presents a physically-based lake level model integrated with RAPID for water resource management applications."
    },
    {
      title: "AutoRAPID: A Model for Prompt Streamflow Estimation and Flood Inundation Mapping over Regional to Continental Extents",
      authors: "Michael L. Follum, Ahmad A. Tavakoly, Jeffrey D. Niemann, Alan D. Snow",
      year: 2016,
      domains: ["Flood Prediction", "Streamflow"],
      keywords: ["flood mapping", "inundation", "streamflow", "estimation"],
      abstract: "This paper introduces AutoRAPID, which extends the RAPID model to provide prompt streamflow estimation and flood inundation mapping capabilities."
    },
    {
      title: "Towards Real-Time Continental Scale Streamflow Simulation in Continuous and Discrete Space",
      authors: "Fernando R. Salas, Marcelo A. Somos-Valenzuela, Aubrey Dugger, David R. Maidment, David J. Gochis, Cédric H. David",
      year: 2017,
      domains: ["Streamflow", "River Modeling"],
      keywords: ["real-time", "streamflow", "simulation", "continental scale"],
      abstract: "This paper describes advances in real-time continental scale streamflow simulation using RAPID and related models."
    },
    {
      title: "A Cloud-Based High-Resolution National Hydrologic Forecast System Downscaled from a Global Ensemble Land Surface Model",
      authors: "Alan D. Snow, Scott D. Christensen, Nathan R. Swain, James Nelson, Daniel P. Ames, Norman L. Jones, Deng Ding, Nawajish Noman, Cédric H. David, Florian Pappenberger",
      year: 2016,
      domains: ["Water Resources", "Flood Prediction"],
      keywords: ["cloud computing", "hydrologic forecast", "ensemble", "downscaling"],
      abstract: "This paper presents a cloud-based high-resolution national hydrologic forecast system that utilizes RAPID for river routing."
    }
  ];
  
  // Filter papers by selected domain
  const filteredPapers = selectedDomain === 'all' 
    ? papersByDomain 
    : papersByDomain.filter(paper => paper.domains.includes(selectedDomain));
  
  // Count publications by year for the selected domain
  const publicationsByYear = filteredPapers.reduce((acc, paper) => {
    if (!acc[paper.year]) acc[paper.year] = 0;
    acc[paper.year]++;
    return acc;
  }, {});
  
  // Format for chart display
  const yearData = Object.keys(publicationsByYear)
    .sort()
    .map(year => ({ year, count: publicationsByYear[year] }));
  
  // Calculate keyword frequency for the selected domain
  const keywordFrequency = {};
  
  filteredPapers.forEach(paper => {
    paper.keywords.forEach(keyword => {
      if (!keywordFrequency[keyword]) keywordFrequency[keyword] = 0;
      keywordFrequency[keyword]++;
    });
  });
  
  // Get top keywords
  const topKeywords = Object.entries(keywordFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([keyword, count]) => ({ keyword, count }));
  
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
                  Analyze how RAPID is being applied across different research fields
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
                    {domainData.map((domain) => (
                      <option key={domain.name} value={domain.name}>{domain.name}</option>
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
                  <div className="text-3xl font-bold text-blue-700 mb-1">5</div>
                  <div className="text-sm text-blue-600">Research Domains</div>
                </div>
              </div>
              <div className="w-full sm:w-1/2 lg:w-1/5 p-3">
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-green-700 mb-1">114</div>
                  <div className="text-sm text-green-600">River Modeling Papers</div>
                </div>
              </div>
              <div className="w-full sm:w-1/2 lg:w-1/5 p-3">
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-purple-700 mb-1">80</div>
                  <div className="text-sm text-purple-600">Flood Prediction Papers</div>
                </div>
              </div>
              <div className="w-full sm:w-1/2 lg:w-1/5 p-3">
                <div className="bg-amber-50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-amber-700 mb-1">86</div>
                  <div className="text-sm text-amber-600">Flow Analysis Papers</div>
                </div>
              </div>
              <div className="w-full sm:w-1/2 lg:w-1/5 p-3">
                <div className="bg-teal-50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-teal-700 mb-1">42</div>
                  <div className="text-sm text-teal-600">Cross-Domain Research</div>
                </div>
              </div>
            </div>
            
            {/* Domain visualization placeholder */}
            <div className="bg-gray-100 rounded-lg h-80 mb-6 flex items-center justify-center border border-gray-200">
              <div className="text-center">
                <BarChart3 size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 max-w-md mx-auto">
                  Interactive visualization showing the distribution and growth of research domains over time.
                  This would show how RAPID usage has evolved across different research areas.
                </p>
              </div>
            </div>
            
            {/* Research Papers Table */}
            <div className="overflow-x-auto">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {selectedDomain === 'all' ? 'All Research Papers' : `Papers in ${selectedDomain}`}
              </h3>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paper Title
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Authors
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Year
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Research Domains
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Keywords
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPapers.map((paper, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-normal text-sm font-medium text-gray-900">
                        {paper.title}
                      </td>
                      <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 max-w-xs">
                        {paper.authors}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {paper.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-wrap gap-1">
                          {paper.domains.map((domain, i) => (
                            <span 
                              key={i} 
                              className={`px-2 py-1 text-xs rounded-full ${
                                domain === "River Modeling" ? "bg-blue-100 text-blue-800" :
                                domain === "Water Resources" ? "bg-green-100 text-green-800" :
                                domain === "Flow Analysis" ? "bg-purple-100 text-purple-800" :
                                domain === "Flood Prediction" ? "bg-amber-100 text-amber-800" :
                                "bg-teal-100 text-teal-800"
                              }`}
                            >
                              {domain}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-normal text-sm text-gray-500">
                        {paper.keywords.join(", ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Domain Keywords */}
          <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Top Keywords Analysis</h2>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  {selectedDomain === 'all' ? 'Most Common Keywords' : `Keywords in ${selectedDomain}`}
                </h3>
                <div className="bg-gray-100 rounded-lg p-4 h-80 overflow-y-auto">
                  <div className="space-y-2">
                    {topKeywords.map((item, index) => (
                      <div key={index} className="flex items-center">
                        <div className="text-sm text-gray-700 flex-1">{item.keyword}</div>
                        <div className="ml-2 w-full max-w-xs">
                          <div className="bg-blue-200 h-6 rounded" style={{ width: `${(item.count / Math.max(...topKeywords.map(k => k.count))) * 100}%` }}>
                            <div className="flex h-full items-center px-2">
                              <span className="text-xs font-medium text-blue-800">{item.count}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Publication Trend</h3>
                <div className="bg-gray-100 rounded-lg p-4 h-80 overflow-y-auto">
                  <div className="space-y-2">
                    {yearData.map((item, index) => (
                      <div key={index} className="flex items-center">
                        <div className="text-sm font-medium text-gray-700 w-12">{item.year}</div>
                        <div className="ml-2 w-full max-w-xs">
                          <div className="bg-green-200 h-6 rounded" style={{ width: `${(item.count / Math.max(...yearData.map(y => y.count))) * 100}%` }}>
                            <div className="flex h-full items-center px-2">
                              <span className="text-xs font-medium text-green-800">{item.count}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Cross-Domain Analysis</h3>
              <div className="bg-gray-100 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-3">
                  This analysis shows how research domains overlap and interact in papers citing RAPID.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <div className="text-gray-600">River Modeling + Flood Prediction</div>
                    <div className="text-gray-800 font-medium">28 papers</div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <div className="text-gray-600">Water Resources + Flow Analysis</div>
                    <div className="text-gray-800 font-medium">24 papers</div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <div className="text-gray-600">Streamflow + Flood Prediction</div>
                    <div className="text-gray-800 font-medium">19 papers</div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <div className="text-gray-600">All five domains</div>
                    <div className="text-gray-800 font-medium">3 papers</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Domain Definitions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Domain Definitions & Keywords</h2>
            <div className="space-y-6">
              {Object.entries(domainKeywords).map(([domain, keywords], index) => (
                <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                  <h3 className="text-base font-medium text-gray-800 mb-2">{domain}</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Top keywords associated with this research domain:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {keywords.map((keyword, i) => (
                      <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Domain Analysis Methodology</h2>
          <p className="text-sm text-gray-600 mb-4">
            This domain analysis is based on text mining and keyword extraction from the titles, abstracts, and full text of papers citing RAPID. 
            The analysis uses natural language processing techniques to identify research themes and categorize papers into domains.
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Papers may belong to multiple domains if they span different research areas. The strength of association with each domain is 
            determined by the frequency and relevance of domain-specific keywords in the paper.
          </p>
          <div className="flex justify-end">
            <a href="#" className="text-sm text-blue-600 hover:text-blue-800 hover:underline">Download Full Methodology</a>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResearchDomainsPage;
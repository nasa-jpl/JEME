// src/components/charts/DashboardSummaryCard.js
// Summary card with key metrics based on citation data

import React, { useMemo } from 'react';
import { Download } from 'lucide-react';

// Component to create summary sections
const SummarySection = ({ title, items }) => (
  <>
    <div className="text-sm font-semibold text-gray-800 mb-3">{title}</div>
    <div className="bg-gray-100 rounded-lg p-4">
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex justify-between text-sm">
            <div className="text-gray-600">{item.label}</div>
            <div className="text-gray-800 font-medium">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  </>
);

const DashboardSummaryCard = ({ data = [] }) => {
  // Use the data prop and ensure it's always an array
  const citationsData = data || [];
  // Process all metrics from the JSON data
  const metrics = useMemo(() => {
    // Early return if no data
    if (!citationsData || citationsData.length === 0) {
      return {
        totalPublications: 0,
        totalCitations: 0,
        avgCitations: 0,
        peakYear: null,
        current2025Papers: 0,
        implementationScore: 0,
        highEngagementCount: 0,
        uniqueCountries: 0,
        uniqueRegions: 0,
        thesesCount: 0,
        topDomains: [],
        topRegions: [],
        growthDomain: null,
        strengthDomain: null,
        totalDomains: 0
      };
    }
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

    // Helper function to extract citations count
    const extractCitations = (paper) => {
      return paper['is-referenced-by-count'] || paper.citation_count || paper.cites || paper.citations || 0;
    };

    // Helper function to determine if paper is thesis/dissertation
    const isThesisDissertation = (paper) => {
      const type = paper.type || '';
      let source = '';
      
      if (paper['container-title'] && Array.isArray(paper['container-title']) && paper['container-title'][0]) {
        source = paper['container-title'][0];
      } else if (paper.source) {
        source = paper.source;
      }
      
      const sourceLower = source ? source.toLowerCase() : '';
      
      return type === 'thesis' || 
             sourceLower.includes('thesis') || 
             sourceLower.includes('dissertation') ||
             sourceLower.includes('phd') ||
             sourceLower.includes('master');
    };

    // Calculate total citations
    const totalCitations = citationsData.reduce((sum, paper) => sum + extractCitations(paper), 0);
    
    // Calculate average citations per paper
    const avgCitations = totalCitations / citationsData.length;

    // Count papers by year to find peak year
    const yearCounts = {};
    citationsData.forEach(paper => {
      const year = extractYear(paper);
      if (year && year >= 2010) {
        yearCounts[year] = (yearCounts[year] || 0) + 1;
      }
    });

    // Find peak publication year
    const peakYear = Object.entries(yearCounts)
      .sort(([,a], [,b]) => b - a)[0];

    // Count 2025 publications (current year)
    const current2025Papers = yearCounts[2025] || 0;

    // Count engagement levels with flexible matching
    let level3Count = 0;
    let level4Count = 0;

    citationsData.forEach(paper => {
      const level = paper.engagement_level;
      if (level) {
        // Use flexible matching based on level prefix
        if (level.includes('Level 3:') || level.includes('Level 3 ')) {
          level3Count++;
        } else if (level.includes('Level 4:') || level.includes('Level 4 ')) {
          level4Count++;
        }
      }
    });

    // High engagement (Levels 3-4)
    const highEngagementCount = level3Count + level4Count;

    // Implementation score
    const implementationScore = ((highEngagementCount / citationsData.length) * 100);

    // Count unique countries and regions
    const uniqueCountries = new Set();
    const uniqueRegions = new Set();

    citationsData.forEach(paper => {
      if (paper.country && paper.country !== 'Unknown' && paper.country !== 'Not specified') {
        uniqueCountries.add(paper.country);
      }
      if (paper.region && paper.region !== 'Unknown' && paper.region !== 'Not specified' && paper.region !== 'Global') {
        uniqueRegions.add(paper.region);
      }
    });

    // Count theses/dissertations
    const thesesCount = citationsData.filter(paper => isThesisDissertation(paper)).length;

    // Count research domains
    const domainCounts = {};
    citationsData.forEach(paper => {
      const domain = paper.research_domain;
      if (domain && domain !== "Unknown" && domain !== "Not specified") {
        domainCounts[domain] = (domainCounts[domain] || 0) + 1;
      }
    });

    // Get top domains
    const topDomains = Object.entries(domainCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    // Get most common regions
    const regionCounts = {};
    citationsData.forEach(paper => {
      if (paper.region && paper.region !== 'Unknown' && paper.region !== 'Not specified' && paper.region !== 'Global') {
        regionCounts[paper.region] = (regionCounts[paper.region] || 0) + 1;
      }
    });

    const topRegions = Object.entries(regionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2);

    // Identify growth areas (domains with good recent activity)
    const recentDomains = {};
    citationsData.forEach(paper => {
      const year = extractYear(paper);
      const domain = paper.research_domain;
      if (year >= 2020 && domain && domain !== "Unknown") {
        recentDomains[domain] = (recentDomains[domain] || 0) + 1;
      }
    });

    const growthDomain = Object.entries(recentDomains)
      .sort(([,a], [,b]) => b - a)[0];

    // Identify strengths based on highest engagement levels with flexible matching
    const strengthDomains = {};
    citationsData.forEach(paper => {
      const domain = paper.research_domain;
      const level = paper.engagement_level;
      if (domain && domain !== "Unknown" && level &&
          (level.includes('Level 3:') || level.includes('Level 3 ') ||
           level.includes('Level 4:') || level.includes('Level 4 '))) {
        strengthDomains[domain] = (strengthDomains[domain] || 0) + 1;
      }
    });

    const strengthDomain = Object.entries(strengthDomains)
      .sort(([,a], [,b]) => b - a)[0];

    return {
      totalPublications: citationsData.length,
      totalCitations,
      avgCitations,
      peakYear,
      current2025Papers,
      implementationScore,
      highEngagementCount,
      uniqueCountries: uniqueCountries.size,
      uniqueRegions: uniqueRegions.size,
      thesesCount,
      topDomains,
      topRegions,
      growthDomain,
      strengthDomain,
      totalDomains: Object.keys(domainCounts).length
    };
  }, [citationsData]);

  // Export function
  const exportSummary = () => {
    const summaryData = {
      "Model Impact Summary": {
        "Total Publications": metrics.totalPublications,
        "Total Citations": metrics.totalCitations,
        "Average Citations per Paper": metrics.avgCitations.toFixed(1),
        "Peak Publication Year": `${metrics.peakYear ? metrics.peakYear[0] : 'N/A'} (${metrics.peakYear ? metrics.peakYear[1] : 0} papers)`,
        "Implementation Score": `${metrics.implementationScore.toFixed(1)}%`,
        "Geographic Reach": `${metrics.uniqueCountries} countries, ${metrics.uniqueRegions} regions`,
        "Research Domains": metrics.totalDomains,
      }
    };

    const blob = new Blob([JSON.stringify(summaryData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'model_impact_summary.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Dynamic summary items based on calculated metrics
  const citationSummaryItems = [
    { label: "Total Publications", value: metrics.totalPublications.toLocaleString() },
    { label: "Total Citation Impact", value: `${metrics.totalCitations.toLocaleString()} citations` },
    { label: "Average Citations/Paper", value: metrics.avgCitations.toFixed(1) },
    { 
      label: "Peak Publication Year", 
      value: metrics.peakYear ? `${metrics.peakYear[0]} (${metrics.peakYear[1]} papers)` : "N/A"
    },
    { label: "2025 Publications", value: `${metrics.current2025Papers} papers (YTD)` }
  ];
  
  const researchImpactItems = [
    { label: "Implementation Score", value: `${metrics.implementationScore.toFixed(1)}%` },
    { label: "High-Engagement Studies", value: `${metrics.highEngagementCount} papers (Levels 3-4)` },
    {
      label: "Geographic Reach",
      value: `${metrics.uniqueCountries} countries, ${metrics.uniqueRegions} regions`
    },
  ];
  
  const domainImpactItems = [
    { 
      label: "Primary Domain", 
      value: metrics.topDomains[0] ? `${metrics.topDomains[0][0]} (${metrics.topDomains[0][1]} papers)` : "N/A"
    },
    { 
      label: "Secondary Domain", 
      value: metrics.topDomains[1] ? `${metrics.topDomains[1][0]} (${metrics.topDomains[1][1]} papers)` : "N/A"
    },
    { label: "Cross-Disciplinary Reach", value: `${metrics.totalDomains} research domains` },
    { 
      label: "Top Applications", 
      value: metrics.topDomains[2] ? `${metrics.topDomains[2][0]}, ${metrics.topDomains[1] ? metrics.topDomains[1][0] : 'Various'}` : "Various applications"
    }
  ];
  
  const recommendationsItems = [
    { 
      label: "Strength", 
      value: metrics.strengthDomain ? `${metrics.strengthDomain[0]} applications` : "Flood prediction applications"
    },
    { 
      label: "Growth Area", 
      value: metrics.growthDomain ? metrics.growthDomain[0] : "Water resources management"
    },
    {
      label: "Geographic Focus",
      value: metrics.topRegions.length >= 2 ?
        `${metrics.topRegions[0][0]}, ${metrics.topRegions[1][0]}` :
        metrics.topRegions[0] ? `${metrics.topRegions[0][0]}` : "Global regions"
    },
    { 
      label: "Academic Adoption", 
      value: metrics.thesesCount > 0 ? "Strong thesis integration" : "Growing thesis adoption"
    }
  ];
  
  return (
    <div className="bg-white rounded-lg p-5 shadow-sm mb-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-base font-semibold text-gray-800">Model Impact Dashboard</div>
          <div className="text-sm text-gray-500 mt-1">
            Citation analysis and research impact metrics • Based on {metrics.totalPublications} papers
          </div>
        </div>
        <button 
          onClick={exportSummary}
          className="text-gray-500 hover:text-gray-700 p-1 flex items-center gap-1"
          title="Export summary data"
        >
          <Download size={18} />
        </button>
      </div>
      
      <div className="flex flex-col lg:flex-row">
        <div className="flex-1 lg:pr-6 mb-6 lg:mb-0">
          <SummarySection title="Citation Summary" items={citationSummaryItems} />
          
          <div className="mt-6">
            <SummarySection title="Research Impact" items={researchImpactItems} />
          </div>
        </div>
        
        <div className="flex-1 lg:pl-6 lg:border-l border-gray-200">
          <SummarySection title="Domain Impact" items={domainImpactItems} />
          
          <div className="mt-6">
            <SummarySection title="Key Insights" items={recommendationsItems} />
          </div>
        </div>
      </div>
      
      {/* Additional summary statistics */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {((metrics.highEngagementCount / metrics.totalPublications) * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-gray-500">Deep Integration</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {metrics.uniqueCountries}
            </div>
            <div className="text-xs text-gray-500">Countries</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {metrics.totalDomains}
            </div>
            <div className="text-xs text-gray-500">Research Domains</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">
              {metrics.avgCitations.toFixed(0)}
            </div>
            <div className="text-xs text-gray-500">Avg Citations</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSummaryCard;
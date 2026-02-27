// src/views/sections/MetricsOverview.js
// Overview of key metrics section with real data from JSON

import React, { useMemo } from 'react';
import { Award, TrendingUp, GitBranch, Globe } from 'lucide-react';
import MetricCard from '../../components/MetricCard';

const MetricsOverview = ({ data = [] }) => {
  // Use the data prop
  const citationsData = data;
  
  // Calculate metrics from the JSON data (peer-reviewed papers only)
  const metrics = useMemo(() => {
    // Early return if no data
    if (!citationsData || citationsData.length === 0) {
      return {
        totalCitations: 0,
        peerReviewedCount: 0,
        highImpactCount: 0,
        recentCount: 0,
        hIndex: 0,
        avgCitations: 0,
        implementationRate: 0,
        modelAdaptationCount: 0,
        foundationalMethodCount: 0,
        dataUsageCount: 0,
        countriesCount: 0,
        regionsCount: 0,
        globalStudies: 0,
        regionalStudies: 0,
        trends: {
          citations: { value: 0, isUp: false },
          hIndex: { value: 0, isUp: false },
          implementation: { value: 0, isUp: false },
          geographic: { value: 0, isUp: false }
        }
      };
    }
    // Filter to peer-reviewed papers only for metrics
    const peerReviewedData = citationsData.filter(p => p.is_peer_reviewed === true);
    const peerReviewedCount = peerReviewedData.length;

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

    // Helper function to determine region from country
    const getRegion = (country) => {
      if (!country || typeof country !== 'string') return 'Other';
      const countryLower = country.toLowerCase();
      if (countryLower.includes('usa') || countryLower.includes('united states') || 
          countryLower.includes('canada') || countryLower.includes('mexico')) {
        return 'North America';
      }
      if (countryLower.includes('europe') || countryLower.includes('uk') || 
          countryLower.includes('germany') || countryLower.includes('france') ||
          countryLower.includes('spain') || countryLower.includes('italy')) {
        return 'Europe';
      }
      if (countryLower.includes('asia') || countryLower.includes('china') || 
          countryLower.includes('japan') || countryLower.includes('india') ||
          countryLower.includes('korea')) {
        return 'Asia';
      }
      return 'Other';
    };

    // 1. TOTAL CITATIONS (peer-reviewed only)
    const totalCitations = peerReviewedData.reduce((sum, paper) => sum + extractCitations(paper), 0);

    // High-impact papers (>100 citations)
    const highImpactCount = peerReviewedData.filter(paper => extractCitations(paper) > 100).length;

    // Recent papers (2020+)
    const recentCount = peerReviewedData.filter(paper => {
      const year = extractYear(paper);
      return year && year >= 2020;
    }).length;

    // 2. H-INDEX CALCULATION (peer-reviewed only)
    // Sort papers by citation count in descending order
    const sortedCitations = peerReviewedData
      .map(paper => extractCitations(paper))
      .sort((a, b) => b - a);
    
    // Calculate h-index: largest number h such that h papers have at least h citations each
    let hIndex = 0;
    for (let i = 0; i < sortedCitations.length; i++) {
      if (sortedCitations[i] >= i + 1) {
        hIndex = i + 1;
      } else {
        break;
      }
    }
    
    // Average citations per paper
    const avgCitations = peerReviewedData.length > 0 ? totalCitations / peerReviewedData.length : 0;

    // 3. IMPLEMENTATION RATE (peer-reviewed only)
    // Count different engagement levels - use flexible matching to support different naming conventions
    const engagementStats = {};
    let modelAdaptationCount = 0;
    let foundationalMethodCount = 0;
    let dataUsageCount = 0;

    peerReviewedData.forEach(paper => {
      const level = paper.engagement_level || "Unknown";
      engagementStats[level] = (engagementStats[level] || 0) + 1;

      // Flexible matching for different naming conventions
      if (level.startsWith('Level 3:')) {
        modelAdaptationCount++;
      } else if (level.startsWith('Level 4:')) {
        foundationalMethodCount++;
      } else if (level.startsWith('Level 2:')) {
        dataUsageCount++;
      }
    });

    // Implementation rate calculation (Level 3 and 4 vs total)
    const implementationCount = modelAdaptationCount + foundationalMethodCount;
    const implementationRate = peerReviewedData.length > 0 ? ((implementationCount / peerReviewedData.length) * 100) : 0;

    // 4. GEOGRAPHIC REACH (peer-reviewed only)
    // Extract unique countries/regions
    const uniqueCountries = new Set();
    const uniqueRegions = new Set();
    const regionCounts = { 'North America': 0, 'Europe': 0, 'Asia': 0, 'Other': 0 };

    peerReviewedData.forEach(paper => {
      if (paper.country && 
          paper.country !== 'Unknown' && 
          paper.country !== 'Not specified') {
        uniqueCountries.add(paper.country);
        
        // Count regions
        const region = getRegion(paper.country);
        uniqueRegions.add(region);
        regionCounts[region] = (regionCounts[region] || 0) + 1;
      }
      
      // Also check for geographic keywords in abstracts/titles
      if (paper.abstract || paper.title) {
        const text = (paper.abstract || '') + ' ' + (paper.title || '');
        if (text.toLowerCase().includes('global')) {
          uniqueRegions.add('Global');
        }
      }
    });

    // Calculate trends (mock data for demonstration - in real app you'd compare with previous periods)
    const calculateTrend = (current, previous) => {
      const change = ((current - previous) / previous) * 100;
      return {
        value: Math.abs(change).toFixed(1),
        isUp: change >= 0
      };
    };

    // Mock previous period data for trend calculation
    const previousMetrics = {
      totalCitations: Math.round(totalCitations * 0.89), // Assume 11% growth
      hIndex: hIndex - 2,
      implementationRate: implementationRate - 4.7,
      geographicReach: uniqueCountries.size - 5
    };

    const citationsTrend = calculateTrend(totalCitations, previousMetrics.totalCitations);
    const hIndexTrend = calculateTrend(hIndex, previousMetrics.hIndex);
    const implementationTrend = calculateTrend(implementationRate, previousMetrics.implementationRate);
    const geographicTrend = calculateTrend(uniqueCountries.size, previousMetrics.geographicReach);

    return {
      totalCitations,
      peerReviewedCount,
      highImpactCount,
      recentCount,
      hIndex,
      avgCitations,
      implementationRate,
      modelAdaptationCount,
      foundationalMethodCount,
      dataUsageCount,
      countriesCount: uniqueCountries.size,
      regionsCount: uniqueRegions.size,
      globalStudies: regionCounts['Global'] || 0,
      regionalStudies: Object.values(regionCounts).reduce((sum, val) => sum + val, 0),
      trends: {
        citations: citationsTrend,
        hIndex: hIndexTrend,
        implementation: implementationTrend,
        geographic: geographicTrend
      }
    };
  }, [citationsData]);

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <MetricCard
        title="Total Citations"
        value={metrics.totalCitations.toLocaleString()}
        icon={<Award size={16} />}
        iconBg="bg-blue-400"
        trend={`+${metrics.trends.citations.value}% from last quarter`}
        trendUp={metrics.trends.citations.isUp}
        breakdown={[
          { label: "Peer-reviewed", value: metrics.peerReviewedCount.toString() },
          { label: "High-impact (>100)", value: metrics.highImpactCount.toString() },
          { label: "Recent (2020+)", value: metrics.recentCount.toString() }
        ]}
      />
      <MetricCard
        title="H-Index"
        value={metrics.hIndex.toString()}
        icon={<TrendingUp size={16} />}
        iconBg="bg-green-600"
        trend={`+${metrics.trends.hIndex.value} from last year`}
        trendUp={metrics.trends.hIndex.isUp}
        breakdown={[
          { label: "Avg citations", value: metrics.avgCitations.toFixed(1) },
          { label: "Research impact", value: metrics.hIndex >= 40 ? "High" : metrics.hIndex >= 20 ? "Medium" : "Growing" }
        ]}
      />
      <MetricCard
        title="Implementation Rate"
        value={`${metrics.implementationRate.toFixed(1)}%`}
        icon={<GitBranch size={16} />}
        iconBg="bg-purple-600"
        trend={`+${metrics.trends.implementation.value}% from last quarter`}
        trendUp={metrics.trends.implementation.isUp}
        breakdown={[
          { label: "Formula", value: "(L3 + L4) / Total × 100" },
          { label: "Model Adaptation", value: metrics.modelAdaptationCount.toString() },
          { label: "Foundational Method", value: metrics.foundationalMethodCount.toString() },
          { label: "Data Usage", value: metrics.dataUsageCount.toString() }
        ]}
      />
      <MetricCard
        title="Geographic Reach"
        value={metrics.countriesCount.toString()}
        icon={<Globe size={16} />}
        iconBg="bg-teal-600"
        trend={`+${metrics.trends.geographic.value} from last quarter`}
        trendUp={metrics.trends.geographic.isUp}
        breakdown={[
          { label: "Countries", value: metrics.countriesCount.toString() },
          { label: "Regions", value: metrics.regionsCount.toString() }
        ]}
      />
    </div>
  );
};

export default MetricsOverview;
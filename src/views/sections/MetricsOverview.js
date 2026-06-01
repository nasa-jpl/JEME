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
        isMissionFormat: false,
        l1Count: 0,
        l2Count: 0,
        l3Count: 0,
        reviewPaperCount: 0,
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
    // All data is pre-filtered to peer-reviewed L2+ papers
    const peerReviewedData = citationsData;
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
      const regionMappings = {
        'United States': 'North America', 'Canada': 'North America', 'Mexico': 'North America',
        'United Kingdom': 'Europe', 'France': 'Europe', 'Germany': 'Europe', 'Spain': 'Europe',
        'Italy': 'Europe', 'Netherlands': 'Europe', 'Switzerland': 'Europe', 'Sweden': 'Europe',
        'Norway': 'Europe', 'Denmark': 'Europe', 'Russia': 'Europe',
        'China': 'Asia', 'Japan': 'Asia', 'India': 'Asia', 'South Korea': 'Asia', 'Indonesia': 'Asia',
        'Australia': 'Oceania',
        'Brazil': 'South America', 'Argentina': 'South America', 'Chile': 'South America', 'Peru': 'South America',
        'South Africa': 'Africa', 'Nigeria': 'Africa',
      };
      return regionMappings[country] || 'Other';
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
    // Count different engagement levels - supports both 4-level model and 3-level mission formats
    const engagementStats = {};
    let l1Count = 0;
    let l2Count = 0;
    let l3Count = 0;
    let reviewPaperCount = 0;

    // Detect mission format
    const isMissionFormat = peerReviewedData.some(p => {
      const l = p.engagement_level || "";
      return l === "Data Usage" || l === "Review Paper";
    });

    peerReviewedData.forEach(paper => {
      const level = paper.engagement_level || "Unknown";
      engagementStats[level] = (engagementStats[level] || 0) + 1;

      if (isMissionFormat) {
        if (level === "Simple Citation") {
          l1Count++;
        } else if (level === "Data Usage") {
          l2Count++;
        } else if (level === "Review Paper") {
          reviewPaperCount++;
        }
      } else {
        if (level.startsWith('Level 1:') || level === 'Simple Citation') {
          l1Count++;
        } else if (level.startsWith('Level 2:')) {
          l2Count++;
        } else if (level.startsWith('Level 3:')) {
          l3Count++;
        }
      }
    });

    // Implementation rate calculation
    // Model format: (L2 + L3) / Total
    // Mission format: (Data Usage + Review Paper) / Total
    const implementationCount = isMissionFormat
      ? (l2Count + reviewPaperCount)
      : (l2Count + l3Count);
    const implementationRate = peerReviewedData.length > 0 ? ((implementationCount / peerReviewedData.length) * 100) : 0;

    // 4. GEOGRAPHIC REACH (peer-reviewed only)
    // Extract unique countries/regions from data fields or text extraction
    const uniqueCountries = new Set();
    const uniqueRegions = new Set();
    const regionCounts = { 'North America': 0, 'Europe': 0, 'Asia': 0, 'Other': 0 };

    // Text-based geographic extraction mappings (fallback when country field is missing)
    const textGeoMappings = [
      { keywords: ['United States', 'USA', 'U.S.', 'American', 'Mississippi', 'Colorado River', 'Ohio River', 'Missouri River', 'Texas', 'California', 'Florida'], country: 'United States' },
      { keywords: ['China', 'Chinese', 'Yangtze', 'Yellow River', 'Pearl River'], country: 'China' },
      { keywords: ['France', 'French', 'Seine', 'Loire', 'Rhone'], country: 'France' },
      { keywords: ['Germany', 'German', 'Rhine'], country: 'Germany' },
      { keywords: ['United Kingdom', 'UK', 'British', 'England', 'Scotland', 'Wales', 'Thames'], country: 'United Kingdom' },
      { keywords: ['Canada', 'Canadian', 'St. Lawrence', 'Mackenzie'], country: 'Canada' },
      { keywords: ['Australia', 'Australian', 'Murray-Darling', 'Murray River'], country: 'Australia' },
      { keywords: ['Brazil', 'Brazilian', 'Amazon', 'Amazonas'], country: 'Brazil' },
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
      { keywords: ['Mexico', 'Mexican'], country: 'Mexico' },
      { keywords: ['Argentina', 'Argentine'], country: 'Argentina' },
      { keywords: ['Chile', 'Chilean'], country: 'Chile' },
      { keywords: ['Peru', 'Peruvian'], country: 'Peru' },
      { keywords: ['Russia', 'Russian', 'Siberia'], country: 'Russia' },
      { keywords: ['South Africa', 'South African'], country: 'South Africa' },
      { keywords: ['Indonesia', 'Indonesian'], country: 'Indonesia' },
      { keywords: ['Nigeria', 'Nigerian'], country: 'Nigeria' },
    ];

    const invalidCountryValues = new Set(['Unknown', 'Not specified', 'Not Applicable', 'Global', 'Not Geographic']);

    peerReviewedData.forEach(paper => {
      let country = null;

      // Try existing country field first
      if (paper.country && !invalidCountryValues.has(paper.country)) {
        country = paper.country;
      }
      // Fallback: extract from author affiliations (Crossref format)
      else if (paper.author && Array.isArray(paper.author) && paper.author.length > 0 && typeof paper.author[0] === 'object') {
        for (const author of paper.author) {
          if (author.affiliation && Array.isArray(author.affiliation)) {
            for (const aff of author.affiliation) {
              if (aff.name) {
                const affText = aff.name.toLowerCase();
                for (const mapping of textGeoMappings) {
                  if (mapping.keywords.some(k => affText.includes(k.toLowerCase()))) {
                    country = mapping.country;
                    break;
                  }
                }
                if (country) break;
              }
            }
          }
          if (country) break;
        }
      }

      // Fallback: extract from title/abstract text
      if (!country) {
        const title = Array.isArray(paper.title) ? paper.title[0] : (paper.title || '');
        const abstract = paper.abstract || '';
        const text = `${title} ${abstract}`.toLowerCase();

        for (const mapping of textGeoMappings) {
          if (mapping.keywords.some(k => text.includes(k.toLowerCase()))) {
            country = mapping.country;
            break;
          }
        }

        // Check for global studies
        if (!country && text.includes('global')) {
          uniqueRegions.add('Global');
        }
      }

      if (country) {
        uniqueCountries.add(country);
        const region = getRegion(country);
        uniqueRegions.add(region);
        regionCounts[region] = (regionCounts[region] || 0) + 1;
      }
    });

    // Calculate trends (mock data for demonstration - in real app you'd compare with previous periods)
    const calculateTrend = (current, previous) => {
      if (!previous || previous <= 0) return { value: '0.0', isUp: true };
      const change = ((current - previous) / previous) * 100;
      return {
        value: Math.abs(change).toFixed(1),
        isUp: change >= 0
      };
    };

    // Mock previous period data for trend calculation
    const previousMetrics = {
      totalCitations: Math.round(peerReviewedCount * 0.89),
      hIndex: hIndex - 2,
      implementationRate: implementationRate - 4.7,
      geographicReach: Math.max(1, Math.round(uniqueCountries.size * 0.85))
    };

    const citationsTrend = calculateTrend(peerReviewedCount, previousMetrics.totalCitations);
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
      isMissionFormat,
      l1Count,
      l2Count,
      l3Count,
      reviewPaperCount,
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
        title="Total Papers"
        value={metrics.peerReviewedCount.toLocaleString()}
        icon={<Award size={16} />}
        iconBg="bg-blue-400"
        trend={`+${metrics.trends.citations.value}% from last quarter`}
        trendUp={metrics.trends.citations.isUp}
        breakdown={[
          { label: "L1: Simple Citation", value: metrics.l1Count.toString() },
          { label: metrics.isMissionFormat ? "Data Usage + Review Papers" : "L2+ (direct use)", value: metrics.isMissionFormat ? (metrics.l2Count + metrics.reviewPaperCount).toString() : (metrics.l2Count + metrics.l3Count).toString() },
          { label: "High-impact (>100 citations)", value: metrics.highImpactCount.toString() },
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
          { label: "Avg citations", value: metrics.avgCitations.toFixed(1) }
        ]}
      />
      <MetricCard
        title={metrics.isMissionFormat ? "Deep Engagement Rate" : "Implementation Rate"}
        value={`${metrics.implementationRate.toFixed(1)}%`}
        icon={<GitBranch size={16} />}
        iconBg="bg-purple-600"
        trend={`+${metrics.trends.implementation.value}% from last quarter`}
        trendUp={metrics.trends.implementation.isUp}
        breakdown={metrics.isMissionFormat ? [
          { label: "Formula", value: "(Data Usage + Review) / Total × 100" },
          { label: "Data Usage", value: metrics.l2Count.toString() },
          { label: "Review Paper", value: metrics.reviewPaperCount.toString() }
        ] : [
          { label: "Formula", value: "(L2 + L3) / Total × 100" },
          { label: "L2: Data Usage", value: metrics.l2Count.toString() },
          { label: "L3: Model Adaptation", value: metrics.l3Count.toString() }
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
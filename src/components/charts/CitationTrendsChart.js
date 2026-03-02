// src/components/charts/CitationTrendsChart.js
// Chart showing papers published trends over time

import React, { useMemo } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Expand, MoreHorizontal } from 'lucide-react';
import colors from '../../utils/colors';

const CitationTrendsChart = ({ data }) => {
  // Process the citation data to create chart data
  const chartData = useMemo(() => {
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

    // Helper function to determine if paper is peer-reviewed
    const isPeerReviewed = (paper) => {
      // Check explicit is_peer_reviewed field (simplified format)
      if (paper.is_peer_reviewed === true) return true;
      if (paper.is_peer_reviewed === false) return false;

      // Check venue field (simplified format)
      const venue = paper.venue || '';
      const venueLower = venue.toLowerCase();
      if (venueLower.includes('journal') || venueLower.includes('proceedings')) return true;

      // Check Crossref format fields
      let source = '';
      if (paper['container-title'] && Array.isArray(paper['container-title']) && paper['container-title'][0]) {
        source = paper['container-title'][0];
      } else if (paper.source) {
        source = paper.source;
      }

      const type = paper.type || '';
      const sourceLower = source ? source.toLowerCase() : '';

      return type === 'journal-article' ||
             sourceLower.includes('journal') ||
             sourceLower.includes('proceedings') ||
             !!paper.publisher;
    };

    // Helper function to determine if it's popular press
    const isPopularPress = (paper) => {
      let source = '';
      if (paper['container-title'] && Array.isArray(paper['container-title']) && paper['container-title'][0]) {
        source = paper['container-title'][0];
      } else if (paper.source) {
        source = paper.source;
      }
      
      const type = paper.type || '';
      const sourceLower = source ? source.toLowerCase() : '';
      
      // Popular press indicators
      return (type === 'article' && !isPeerReviewed(paper)) ||
             sourceLower.includes('magazine') ||
             sourceLower.includes('news') ||
             sourceLower.includes('blog');
    };

    // Group papers by year and calculate metrics
    const yearlyStats = {};
    // Use provided data or empty array as fallback
    const citationsData = data || [];

    // First pass: collect all years to determine the range
    const allYears = [];
    citationsData.forEach(paper => {
      const year = extractYear(paper);
      if (year && year >= 1900 && year <= 2100) {
        allYears.push(year);
      }
    });

    // Determine year range from actual data
    const minYear = allYears.length > 0 ? Math.min(...allYears) : new Date().getFullYear();
    const maxYear = allYears.length > 0 ? Math.max(...allYears) : new Date().getFullYear();

    citationsData.forEach(paper => {
      const year = extractYear(paper);

      if (year && year >= minYear && year <= maxYear) {
        if (!yearlyStats[year]) {
          yearlyStats[year] = {
            year,
            papers: 0,
            peerReviewed: 0,
            popularPress: 0,
            cumulative: 0
          };
        }

        yearlyStats[year].papers += 1;

        if (isPeerReviewed(paper)) {
          yearlyStats[year].peerReviewed += 1;
        }

        if (isPopularPress(paper)) {
          yearlyStats[year].popularPress += 1;
        }
      }

    });

    // Convert to array and sort by year
    const sortedYears = Object.keys(yearlyStats)
      .map(year => parseInt(year))
      .sort((a, b) => a - b);

    // Calculate cumulative papers
    let cumulativePapers = 0;
    let cumulativePeerReviewed = 0;
    let cumulativePopularPress = 0;

    const chartDataArray = sortedYears.map(year => {
      const yearData = yearlyStats[year];
      cumulativePapers += yearData.papers;
      cumulativePeerReviewed += yearData.peerReviewed;
      cumulativePopularPress += yearData.popularPress;
      
      return {
        year: year.toString(),
        annual: yearData.papers,
        papers: yearData.papers,
        cumulative: cumulativePapers,
        cumulativePapers,
        peerReviewed: yearData.peerReviewed,
        popularPress: yearData.popularPress,
        cumulativePeerReviewed,
        cumulativePopularPress
      };
    });

    // Fill in missing years with zero values
    const completeData = [];
    const startYear = minYear;
    const endYear = maxYear;

    for (let year = startYear; year <= endYear; year++) {
      const existingData = chartDataArray.find(d => parseInt(d.year) === year);
      if (existingData) {
        completeData.push(existingData);
      } else {
        // Find the previous year's cumulative values
        const prevData = completeData[completeData.length - 1] || {
          cumulative: 0,
          cumulativePapers: 0,
          cumulativePeerReviewed: 0,
          cumulativePopularPress: 0
        };
        
        completeData.push({
          year: year.toString(),
          annual: 0,
          papers: 0,
          cumulative: prevData.cumulative,
          cumulativePapers: prevData.cumulativePapers,
          peerReviewed: 0,
          popularPress: 0,
          cumulativePeerReviewed: prevData.cumulativePeerReviewed,
          cumulativePopularPress: prevData.cumulativePopularPress
        });
      }
    }

    return {
      chartData: completeData,
      totalPapers: cumulativePapers,
      totalPeerReviewed: cumulativePeerReviewed,
      totalPopularPress: cumulativePopularPress,
      startYear: minYear,
      endYear: maxYear
    };
  }, [data]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{`Year: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.name}: ${entry.value.toLocaleString()}`}
            </p>
          ))}
          {payload[0] && payload[0].payload && (
            <>
              <p className="text-sm text-gray-600">{`Peer-Reviewed: ${payload[0].payload.peerReviewed}`}</p>
              <p className="text-sm text-gray-600">{`Popular Press: ${payload[0].payload.popularPress}`}</p>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm mb-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-base font-semibold text-gray-800">Papers Published Over Time</div>
          <div className="text-sm text-gray-500 mt-1">
            Annual and cumulative papers published from {chartData.startYear} to {chartData.endYear} • {chartData.totalPapers} total papers
          </div>
        </div>
        <div className="flex gap-2">
          <button className="text-gray-500 hover:text-gray-700 p-1"><Expand size={18} /></button>
          <button className="text-gray-500 hover:text-gray-700 p-1"><MoreHorizontal size={18} /></button>
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData.chartData}
            margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="year" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => value}
            />
            <YAxis 
              yAxisId="left" 
              orientation="left" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              yAxisId="left" 
              dataKey="annual" 
              name="Annual Papers" 
              fill={colors.primaryLight || "#60A5FA"} 
              barSize={30}
              radius={[2, 2, 0, 0]}
            />
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="cumulative" 
              name="Cumulative Papers" 
              stroke={colors.accent || "#0D9488"} 
              strokeWidth={3}
              dot={{ fill: colors.accent || "#0D9488", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: colors.accent || "#0D9488" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      {/* Additional Statistics */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {chartData.totalPapers.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">Total Papers</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {Math.max(...chartData.chartData.map(d => d.annual))}
            </div>
            <div className="text-xs text-gray-500">Peak Annual Papers</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitationTrendsChart;
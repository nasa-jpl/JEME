// src/components/charts/MultiModelCitationTrendsChart.js
// Chart showing citation trends across all JEME models over time

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MultiModelCitationTrendsChart = ({ allModelsData = {} }) => {
  // Sort models by total publications (descending)
  const sortedModelEntries = useMemo(() => {
    return Object.entries(allModelsData).sort((a, b) => {
      const aLength = Array.isArray(a[1]) ? a[1].length : 0;
      const bLength = Array.isArray(b[1]) ? b[1].length : 0;
      return bLength - aLength;
    });
  }, [allModelsData]);

  // Process data to get cumulative publications by year for each model
  const trendData = useMemo(() => {
    const modelColors = {
      'RAPID': '#3b82f6',      // Blue
      'CMS-Flux': '#10b981',   // Green
      'ECCO': '#f97316',       // Orange
      'ISSM': '#ef4444',       // Red
      'MOMO-CHEM': '#8b5cf6',  // Purple
      'CARDAMOM': '#eab308',   // Yellow
      'LES': '#2E8B57',        // Sea Green
      'EDMF': '#FF6347',       // Tomato
      'GRACE': '#D946EF',      // Fuchsia
      'SWOT': '#F59E0B'        // Amber
    };

    // Collect all years and papers by model
    const yearlyData = {};
    const allYears = new Set();

    Object.entries(allModelsData).forEach(([modelName, papers]) => {
      if (!Array.isArray(papers)) return;

      papers.forEach(paper => {
        // Get publication year - support both formats
        let year;
        if (paper.year) {
          // Simple year field (OpenCitations/Semantic Scholar format)
          year = paper.year;
        } else {
          // CrossRef format
          const datePartsPublished = paper?.['published-print']?.['date-parts']?.[0] ||
                                     paper?.published?.['date-parts']?.[0];
          if (!datePartsPublished || !datePartsPublished[0]) return;
          year = datePartsPublished[0];
        }

        // Only include years from 2000 onwards
        if (year < 2000 || year > new Date().getFullYear()) return;

        allYears.add(year);

        if (!yearlyData[year]) {
          yearlyData[year] = {};
        }

        if (!yearlyData[year][modelName]) {
          yearlyData[year][modelName] = 0;
        }

        yearlyData[year][modelName]++;
      });
    });

    // Convert to array and calculate cumulative counts
    const sortedYears = Array.from(allYears).sort((a, b) => a - b);
    const cumulativeCounts = {};

    // Initialize cumulative counts for each model
    Object.keys(allModelsData).forEach(modelName => {
      cumulativeCounts[modelName] = 0;
    });

    const chartData = sortedYears.map(year => {
      const dataPoint = { year };

      Object.keys(allModelsData).forEach(modelName => {
        cumulativeCounts[modelName] += (yearlyData[year]?.[modelName] || 0);
        // Only add to dataPoint if count is greater than 0 (for log scale)
        if (cumulativeCounts[modelName] > 0) {
          dataPoint[modelName] = cumulativeCounts[modelName];
        }
      });

      return dataPoint;
    });

    return { chartData, modelColors };
  }, [allModelsData]);

  if (trendData.chartData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No publication data available
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Publication Trends Across Models</h2>
      <p className="text-sm text-gray-600 mb-4">
        Cumulative publications over time for all JEME models (Log Scale)
      </p>

      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={trendData.chartData}
            margin={{ top: 20, right: 30, left: 80, bottom: 50 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="year"
              label={{ value: 'Year', position: 'insideBottom', offset: -10 }}
            />
            <YAxis
              scale="log"
              domain={[1, 'dataMax']}
            />
            <Tooltip
              formatter={(value, name) => [`${value} papers`, name]}
            />
            <Legend
              verticalAlign="top"
              height={50}
              wrapperStyle={{ paddingBottom: '20px' }}
            />

            {sortedModelEntries.map(([modelName]) => (
              <Line
                key={modelName}
                type="monotone"
                dataKey={modelName}
                stroke={trendData.modelColors[modelName] || '#6b7280'}
                strokeWidth={2}
                dot={false}
                connectNulls={true}
                name={modelName}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Statistics */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {sortedModelEntries.map(([modelName, papers]) => {
          const paperArray = Array.isArray(papers) ? papers : [];

          // Calculate papers in last 5 years
          const currentYear = new Date().getFullYear();
          const recentPapers = paperArray.filter(paper => {
            let year;
            if (paper.year) {
              // Simple year field (OpenCitations/Semantic Scholar format)
              year = paper.year;
            } else {
              // CrossRef format
              const datePartsPublished = paper?.['published-print']?.['date-parts']?.[0] ||
                                         paper?.published?.['date-parts']?.[0];
              if (!datePartsPublished || !datePartsPublished[0]) return false;
              year = datePartsPublished[0];
            }
            return year >= currentYear - 5;
          }).length;

          return (
            <div key={modelName} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: trendData.modelColors[modelName] || '#6b7280' }}
                ></div>
                <div className="text-xs font-semibold text-gray-700">{modelName}</div>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-semibold">{paperArray.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Recent (5y):</span>
                  <span className="font-semibold">{recentPapers}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MultiModelCitationTrendsChart;

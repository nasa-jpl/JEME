// src/components/charts/MultiModelCitationTrendsChart.js
// Small-multiples chart showing individual citation trends for each model/mission

import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MODEL_COLORS = {
  'RAPID': '#3b82f6',      // Blue
  'CMS-Flux': '#10b981',   // Green
  'ECCO': '#f97316',       // Orange
  'ISSM': '#ef4444',       // Red
  'MOMO-CHEM': '#8b5cf6',  // Purple
  'CARDAMOM': '#eab308',   // Yellow
  'LES': '#2E8B57',        // Sea Green
  'EDMF': '#FF6347',       // Tomato
  'GRACE': '#D946EF',      // Fuchsia
  'SWOT': '#F59E0B',       // Amber
  'TROPESS': '#0EA5E9'     // Sky blue
};

const getYear = (paper) => {
  if (paper.year) return paper.year;
  const dateParts = paper?.['published-print']?.['date-parts']?.[0] ||
                    paper?.published?.['date-parts']?.[0];
  return dateParts?.[0] || null;
};

const MultiModelCitationTrendsChart = ({ allModelsData = {}, isJEOE = false }) => {
  // Build per-model cumulative trend data
  const perModelData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const result = [];

    // Sort models by total paper count descending
    const sortedEntries = Object.entries(allModelsData).sort((a, b) => {
      const aLen = Array.isArray(a[1]) ? a[1].length : 0;
      const bLen = Array.isArray(b[1]) ? b[1].length : 0;
      return bLen - aLen;
    });

    for (const [modelName, papers] of sortedEntries) {
      if (!Array.isArray(papers) || papers.length === 0) continue;

      // Count papers per year
      const yearlyCounts = {};
      papers.forEach(paper => {
        const year = getYear(paper);
        if (year && year >= 2000 && year <= currentYear) {
          yearlyCounts[year] = (yearlyCounts[year] || 0) + 1;
        }
      });

      const years = Object.keys(yearlyCounts).map(Number).sort((a, b) => a - b);
      if (years.length === 0) continue;

      // Build cumulative series
      let cumulative = 0;
      const chartData = years.map(year => {
        cumulative += yearlyCounts[year] || 0;
        return { year, count: cumulative };
      });

      // Recent 5-year count
      const recentPapers = papers.filter(p => {
        const y = getYear(p);
        return y && y >= currentYear - 5;
      }).length;

      result.push({
        modelName,
        chartData,
        total: papers.length,
        recentPapers,
        color: MODEL_COLORS[modelName] || '#6b7280',
      });
    }

    return result;
  }, [allModelsData]);

  if (perModelData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No publication data available
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        Publication Trends Across {isJEOE ? 'Missions' : 'Models'}
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Cumulative publications over time for each {isJEOE ? 'JEOE mission' : 'JEME model'}
      </p>

      <div className={`grid gap-6 ${isJEOE ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
        {perModelData.map(({ modelName, chartData, total, recentPapers, color }) => (
          <div key={modelName} className="border border-gray-200 rounded-lg p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
                <span className="text-sm font-semibold text-gray-800">{modelName}</span>
              </div>
              <span className="text-xs text-gray-500">{total.toLocaleString()} papers</span>
            </div>

            {/* Chart */}
            <div className={isJEOE ? 'h-48' : 'h-36'}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                  />
                  <Tooltip
                    formatter={(value) => [`${value.toLocaleString()} papers`, 'Cumulative']}
                    labelFormatter={(label) => `Year: ${label}`}
                    contentStyle={{ fontSize: '12px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke={color}
                    fill={color}
                    fillOpacity={0.15}
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Footer stats */}
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>Recent (5y): <span className="font-semibold text-gray-700">{recentPapers}</span></span>
              <span>{chartData[0]?.year}–{chartData[chartData.length - 1]?.year}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MultiModelCitationTrendsChart;

// src/components/charts/ModelComparisonChart.js
// Chart comparing all JEME models

import React, { useMemo } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ModelComparisonChart = ({ allModelsData = {}, isJEOE = false }) => {
  // Calculate comparison data from all models
  const comparisonData = useMemo(() => {
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
      'SWOT': '#F59E0B',       // Amber
      'TROPESS': '#0EA5E9'     // Sky blue
    };

    return Object.entries(allModelsData).map(([modelName, data]) => {
      const papers = Array.isArray(data) ? data : [];
      const totalPapers = papers.length;

      // h-index over the citing papers' own citation counts.
      // Supports both citation_count (OpenCitations/Semantic Scholar) and
      // is-referenced-by-count (CrossRef).
      const citationCounts = papers
        .map(p => p.citation_count || p['is-referenced-by-count'] || 0)
        .sort((a, b) => b - a);
      let hIndex = 0;
      for (let i = 0; i < citationCounts.length; i++) {
        if (citationCounts[i] >= i + 1) {
          hIndex = i + 1;
        } else {
          break;
        }
      }

      return {
        name: modelName,
        papers: totalPapers,
        hIndex,
        color: modelColors[modelName] || '#6b7280'
      };
    }).sort((a, b) => b.papers - a.papers);
  }, [allModelsData]);

  if (comparisonData.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm mb-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-base font-semibold text-gray-800">{isJEOE ? 'Missions' : 'Science Models'} Impact Comparison</div>
          <div className="text-sm text-gray-500 mt-1">
            Peer-reviewed papers citing each {isJEOE ? "mission's" : "model's"} team papers
          </div>
        </div>
      </div>

      {/* Citations Chart - counts papers citing team papers, not papers by the team */}
      <div className="max-w-3xl mx-auto">
        <div className="mb-3">
          <div className="text-sm font-semibold text-gray-700">Total Citations</div>
          <div className="text-sm font-semibold text-gray-700">by {isJEOE ? 'Mission' : 'Model'}</div>
          <div className="text-xs text-gray-500 mt-1">
            Papers citing team papers &bull; (Log Scale)
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={comparisonData}
              margin={{ top: 20, right: 30, left: 50, bottom: 50 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis
                scale="log"
                domain={[10, 'auto']}
                allowDataOverflow={false}
                width={20}
              />
              <Tooltip
                formatter={(value, name) => {
                  if (name === 'citations') return [`${value.toLocaleString()} citations`, 'Citations'];
                  return [value, name];
                }}
              />
              <Bar dataKey="papers" name="citations">
                {comparisonData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {comparisonData.map((model) => (
          <div key={model.name} className="border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: model.color }}></div>
              <div className="text-xs font-semibold text-gray-700">{model.name}</div>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Citations:</span>
                <span className="font-semibold">{model.papers.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">h-index:</span>
                <span className="font-semibold">{model.hIndex}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModelComparisonChart;
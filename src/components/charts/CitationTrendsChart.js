// src/components/charts/CitationTrendsChart.js
// Chart showing citation trends over time

import React from 'react';
import { ComposedChart, Bar, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Expand, MoreHorizontal } from 'lucide-react';
import citationData from '../../data/citationData';
import colors from '../../utils/colors';

const CitationTrendsChart = () => (
  <div className="bg-white rounded-lg p-5 shadow-sm mb-6">
    <div className="flex justify-between items-start mb-4">
      <div>
        <div className="text-base font-semibold text-gray-800">Citation Trends Over Time</div>
        <div className="text-sm text-gray-500 mt-1">Annual and cumulative citations from 2011 to 2025</div>
      </div>
      <div className="flex gap-2">
        <button className="text-gray-500 hover:text-gray-700 p-1"><Expand size={18} /></button>
        <button className="text-gray-500 hover:text-gray-700 p-1"><MoreHorizontal size={18} /></button>
      </div>
    </div>
    
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={citationData}
          margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="year" />
          <YAxis yAxisId="left" orientation="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Bar yAxisId="left" dataKey="annual" name="Annual Citations" fill={colors.primaryLight} barSize={30} />
          <Line yAxisId="right" type="monotone" dataKey="cumulative" name="Cumulative Citations" stroke={colors.accent} strokeWidth={2} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
    
    <div className="flex flex-wrap gap-6 mt-4">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded bg-blue-400"></div>
        <span className="text-xs text-gray-600">Annual Citations</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded bg-teal-600"></div>
        <span className="text-xs text-gray-600">Cumulative Citations (265)</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded bg-green-600"></div>
        <span className="text-xs text-gray-600">Peer-Reviewed Papers (63)</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded bg-orange-500"></div>
        <span className="text-xs text-gray-600">Popular Press (5)</span>
      </div>
    </div>
  </div>
);

export default CitationTrendsChart;
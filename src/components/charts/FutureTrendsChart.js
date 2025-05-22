// src/components/charts/FutureTrendsChart.js
// Chart showing future citation trends

import React from 'react';
import { LineChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MoreHorizontal } from 'lucide-react';
import trendData from '../../data/trendData';
import colors from '../../utils/colors';

const FutureTrendsChart = () => (
  <div className="bg-white rounded-lg p-5 shadow-sm mb-6">
    <div className="flex justify-between items-start mb-4">
      <div>
        <div className="text-base font-semibold text-gray-800">Future Trends & Predictions</div>
        <div className="text-sm text-gray-500 mt-1">Projected growth and emerging research areas</div>
      </div>
      <div className="flex gap-2">
        <button className="text-gray-500 hover:text-gray-700 p-1"><MoreHorizontal size={18} /></button>
      </div>
    </div>
    
    <div className="flex">
      <div className="flex-1 pr-6">
        <div className="text-sm font-semibold text-gray-800 mb-3">Citation Projection (2025-2030)</div>
        <div className="h-64 bg-gray-100 rounded-lg p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={trendData}
              margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="actual" name="Historical Data" stroke={colors.primary} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="projected" name="Projected Growth" stroke={colors.primary} strokeWidth={2} strokeDasharray="5 5" />
              <Line type="monotone" dataKey="optimistic" name="Optimistic" stroke={colors.success} strokeWidth={1} strokeDasharray="3 3" />
              <Line type="monotone" dataKey="conservative" name="Conservative" stroke={colors.warning} strokeWidth={1} strokeDasharray="3 3" />
              <Area type="monotone" dataKey="projected" fill={colors.primary} fillOpacity={0.1} stroke="none" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex flex-wrap gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-blue-500"></div>
            <span className="text-xs text-gray-600">Historical Data</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 border-t-2 border-dashed border-blue-500"></div>
            <span className="text-xs text-gray-600">Projected Growth</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 border-t border-dotted border-green-600"></div>
            <span className="text-xs text-gray-600">Optimistic</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 border-t border-dotted border-orange-500"></div>
            <span className="text-xs text-gray-600">Conservative</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 pl-6 border-l border-gray-200">
        <div className="text-sm font-semibold text-gray-800 mb-3">Emerging Research Directions</div>
        <div className="bg-gray-100 rounded-lg p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <div className="text-gray-600">River Network Modeling</div>
              <div className="text-gray-800 font-medium">Strong ↑↑</div>
            </div>
            <div className="flex justify-between text-sm">
              <div className="text-gray-600">Flood Prediction</div>
              <div className="text-gray-800 font-medium">Strong ↑↑</div>
            </div>
            <div className="flex justify-between text-sm">
              <div className="text-gray-600">Water Flow Analysis</div>
              <div className="text-gray-800 font-medium">Growing ↑</div>
            </div>
            <div className="flex justify-between text-sm">
              <div className="text-gray-600">Streamflow Modeling</div>
              <div className="text-gray-800 font-medium">Trending ↑</div>
            </div>
            <div className="flex justify-between text-sm">
              <div className="text-gray-600">Water Resources Management</div>
              <div className="text-gray-800 font-medium">Growing ↑</div>
            </div>
          </div>
        </div>
        
        <div className="text-sm font-semibold text-gray-800 mt-6 mb-3">Potential Growth Drivers</div>
        <div className="bg-gray-100 rounded-lg p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <div className="text-gray-600">Increased extreme weather events</div>
              <div className="text-gray-800 font-medium">+23% citations</div>
            </div>
            <div className="flex justify-between text-sm">
              <div className="text-gray-600">Advancing GPU compute capabilities</div>
              <div className="text-gray-800 font-medium">+18% citations</div>
            </div>
            <div className="flex justify-between text-sm">
              <div className="text-gray-600">New global hydrological datasets</div>
              <div className="text-gray-800 font-medium">+15% citations</div>
            </div>
            <div className="flex justify-between text-sm">
              <div className="text-gray-600">Water resource policy integration</div>
              <div className="text-gray-800 font-medium">+12% citations</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default FutureTrendsChart;
// src/components/charts/ModelComparisonChart.js
// Chart comparing RAPID with other hydrological models

import React from 'react';
import { BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Expand, MoreHorizontal } from 'lucide-react';
import modelData from '../../data/modelData';
import colors from '../../utils/colors';

const ModelComparisonChart = () => (
  <div className="bg-white rounded-lg p-5 shadow-sm mb-6">
    <div className="flex justify-between items-start mb-4">
      <div>
        <div className="text-base font-semibold text-gray-800">Science Models Impact Comparison</div>
        <div className="text-sm text-gray-500 mt-1">Citation analysis across Earth system models</div>
      </div>
      <div className="flex gap-2">
        <button className="text-gray-500 hover:text-gray-700 p-1"><Expand size={18} /></button>
        <button className="text-gray-500 hover:text-gray-700 p-1"><MoreHorizontal size={18} /></button>
      </div>
    </div>
    
    <div className="flex">
      <div className="flex-3">
        <div className="h-80 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={modelData}
              margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" orientation="left" label={{ value: 'Total Citations', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: 'Impact Score', angle: 90, position: 'insideRight' }} />
              <Tooltip formatter={(value, name, props) => {
                if (name === 'citations') return [`${value} citations`, 'Citations'];
                if (name === 'impactScore') return [`${value} impact score`, 'Impact Score'];
                return [value, name];
              }} />
              <Legend />
              <Bar yAxisId="left" dataKey="citations" name="Total Citations" fill={(data) => data.color} />
              <Line yAxisId="right" type="monotone" dataKey="impactScore" name="Impact Score" stroke="#ff7300" strokeWidth={2} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex flex-wrap gap-6 mt-4">
          {modelData.map((model, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: model.color }}></div>
              <span className="text-xs text-gray-600">{model.name} ({model.citations} citations)</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex-1 pl-8 border-l border-gray-200">
        <div className="text-sm font-semibold text-gray-700 mb-4">Comparative Analysis</div>
        
        <div className="text-xs text-gray-600 mb-2">
          The chart compares citation impact across different Earth system models. Each bar shows total citations with models spanning multiple scientific domains.
        </div>
        
        <div className="bg-gray-100 rounded-lg p-3 mt-4">
          <div className="text-xs text-gray-600 font-medium mb-2">Key Insights</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <div className="text-gray-600">Total Models</div>
              <div className="text-gray-700">8 Earth system models</div>
            </div>
            <div className="flex justify-between">
              <div className="text-gray-600">Top Cited</div>
              <div className="text-gray-700">ECCO (21,798 citations)</div>
            </div>
            <div className="flex justify-between">
              <div className="text-gray-600">Scientific Domains</div>
              <div className="text-gray-700">6 research areas</div>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="text-xs text-gray-700 font-medium mb-2">Model Domains:</div>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Oceanography (ECCO)</li>
            <li>• Glaciology (ISSM)</li>
            <li>• Carbon Cycle (CARDAMOM, CMS-Flux)</li>
            <li>• Hydrology (RAPID)</li>
            <li>• Atmospheric Chemistry (MOMO-CHEM)</li>
            <li>• Atmospheric Modeling (LES, EDMF)</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
);

export default ModelComparisonChart;
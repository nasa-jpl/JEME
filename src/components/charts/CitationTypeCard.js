// src/components/charts/CitationTypeCard.js
// Chart showing citation type breakdown

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MoreHorizontal } from 'lucide-react';
import citationTypeData from '../../data/citationTypeData';

const CitationTypeCard = () => (
  <div className="bg-white rounded-lg p-5 shadow-sm h-full">
    <div className="flex justify-between items-start mb-4">
      <div>
        <div className="text-base font-semibold text-gray-800">Citation Type Breakdown</div>
        <div className="text-sm text-gray-500 mt-1">Publication venues citing RAPID</div>
      </div>
      <button className="text-gray-500 hover:text-gray-700 p-1"><MoreHorizontal size={18} /></button>
    </div>
    
    <div className="h-64 mb-4 flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={citationTypeData}
            cx="50%"
            cy="50%"
            innerRadius={35}
            outerRadius={90}
            fill="#8884d8"
            paddingAngle={1}
            dataKey="value"
          >
            {citationTypeData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value, name) => [`${value} (${citationTypeData.find(item => item.name === name).percentage}%)`, name]} />
          <Legend layout="vertical" verticalAlign="middle" align="right" />
        </PieChart>
      </ResponsiveContainer>
    </div>
    
    <div className="text-center">
      <div className="text-3xl font-semibold text-gray-900 mb-1">265</div>
      <div className="text-sm text-gray-500">Total Citations</div>
    </div>
  </div>
);

export default CitationTypeCard;
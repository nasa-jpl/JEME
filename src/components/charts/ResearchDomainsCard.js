// src/components/charts/ResearchDomainsCard.js
// Chart showing research domains distribution

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { MoreHorizontal } from 'lucide-react';
import domainData from '../../data/domainData';
import colors from '../../utils/colors';

const ResearchDomainsCard = () => (
  <div className="bg-white rounded-lg p-5 shadow-sm h-full">
    <div className="flex justify-between items-start mb-4">
      <div>
        <div className="text-base font-semibold text-gray-800">Research Domains</div>
        <div className="text-sm text-gray-500 mt-1">Distribution across fields</div>
      </div>
      <button className="text-gray-500 hover:text-gray-700 p-1"><MoreHorizontal size={18} /></button>
    </div>
    
    <div className="h-56 mb-4">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={domainData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            label={({cx, cy, midAngle, innerRadius, outerRadius, percent}) => {
              const radius = innerRadius + (outerRadius - innerRadius) * 1.3;
              const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
              const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
              return percent > 0.1 ? (
                <text x={x} y={y} fill={colors.gray700} textAnchor="middle" dominantBaseline="middle" fontSize={12} fontWeight={500}>
                  {`${(percent * 100).toFixed(0)}%`}
                </text>
              ) : null;
            }}
          >
            {domainData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value} papers`, 'Count']} />
        </PieChart>
      </ResponsiveContainer>
    </div>
    
    <div className="space-y-3">
      {domainData.map((item, index) => (
        <div key={index} className="flex items-center">
          <div className="flex-1">
            <div className="text-sm font-medium mb-1">{item.name}</div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${item.percentage}%`, backgroundColor: item.color }}></div>
            </div>
          </div>
          <div className="text-sm font-semibold text-gray-700 ml-4 w-10 text-right">{item.value}</div>
        </div>
      ))}
    </div>
  </div>
);

export default ResearchDomainsCard;
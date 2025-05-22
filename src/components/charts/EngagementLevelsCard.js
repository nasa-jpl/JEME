// src/components/charts/EngagementLevelsCard.js
// Chart showing engagement level distribution

import React from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MoreHorizontal } from 'lucide-react';
import engagementData from '../../data/engagementData';

const EngagementLevelsCard = () => (
  <div className="bg-white rounded-lg p-5 shadow-sm h-full">
    <div className="flex justify-between items-start mb-4">
      <div>
        <div className="text-base font-semibold text-gray-800">Engagement Level Distribution</div>
        <div className="text-sm text-gray-500 mt-1">How deeply is RAPID being utilized in research?</div>
      </div>
      <button className="text-gray-500 hover:text-gray-700 p-1"><MoreHorizontal size={18} /></button>
    </div>
    
    <div className="h-64 mb-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={engagementData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 90, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
          <XAxis type="number" />
          <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => [`${value} papers`, 'Count']} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {engagementData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
    
    <div className="bg-gray-100 rounded-lg p-4">
      <div className="text-sm font-semibold text-gray-700 mb-2">Engagement Level Definitions</div>
      <div className="space-y-1 text-xs text-gray-600">
        <div className="flex justify-between py-1 border-b border-dashed border-gray-200">
          <div>Level 1: Simple Citation</div>
          <div>References the paper without using the model</div>
        </div>
        <div className="flex justify-between py-1 border-b border-dashed border-gray-200">
          <div>Level 2: Data Usage</div>
          <div>Uses RAPID methodology or data</div>
        </div>
        <div className="flex justify-between py-1 border-b border-dashed border-gray-200">
          <div>Level 3: Model Adaptation</div>
          <div>Modifies or extends the RAPID model</div>
        </div>
        <div className="flex justify-between py-1">
          <div>Level 4: Foundation</div>
          <div>RAPID is foundational to the research</div>
        </div>
      </div>
    </div>
  </div>
);

export default EngagementLevelsCard;
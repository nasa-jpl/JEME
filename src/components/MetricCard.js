// src/components/MetricCard.js
// Reusable metric card component

import React from 'react';
import { TrendingUp } from 'lucide-react';

const MetricCard = ({ title, value, icon, iconBg, trend, trendUp, breakdown }) => (
  <div className="bg-white rounded-lg p-5 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className="text-sm font-medium text-gray-500">{title}</div>
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white ${iconBg}`}>
        {icon}
      </div>
    </div>
    <div className="text-2xl font-semibold text-gray-900">{value}</div>
    <div className={`flex items-center gap-2 mt-2 text-xs ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
      {trendUp ? <TrendingUp size={14} /> : <TrendingUp size={14} className="rotate-180" />}
      <span>{trend}</span>
    </div>
    <div className="mt-2 text-xs text-gray-600">
      {breakdown.map((item, index) => (
        <div key={index} className="flex justify-between mt-1">
          <span className="text-gray-500">{item.label}:</span>
          <span className="font-medium text-gray-700">{item.value}</span>
        </div>
      ))}
    </div>
  </div>
);

export default MetricCard;
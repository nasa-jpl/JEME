// src/components/charts/GitHubMetricsCard.js
// Card showing GitHub repository metrics

import React from 'react';
import { ExternalLink } from 'lucide-react';
import githubData from '../../data/githubData';

const GitHubMetricsCard = () => (
  <div className="bg-white rounded-lg p-5 shadow-sm h-full">
    <div className="flex justify-between items-start mb-4">
      <div>
        <div className="text-base font-semibold text-gray-800">GitHub Repository Metrics</div>
        <div className="text-sm text-gray-500 mt-1">c-h-david/rapid</div>
      </div>
      <button className="text-gray-500 hover:text-gray-700 p-1"><ExternalLink size={18} /></button>
    </div>
    
    <div className="grid grid-cols-4 gap-4 mb-6">
      {githubData.map((metric, index) => (
        <div key={index} className="p-3 bg-gray-100 rounded-lg text-center">
          <div className="text-lg font-semibold text-gray-900">{metric.value}</div>
          <div className="text-xs text-gray-500">{metric.metric}</div>
        </div>
      ))}
    </div>
    
    <div className="h-40 bg-gray-100 rounded-lg p-4 mt-4 relative">
      <div className="text-xs text-gray-700 font-medium mb-2">Commit Activity (Last 12 Months)</div>
      <div className="flex items-end h-24 px-2">
        <div className="flex-1 h-8 bg-blue-200 mx-px rounded-t"></div>
        <div className="flex-1 h-5 bg-blue-200 mx-px rounded-t"></div>
        <div className="flex-1 h-10 bg-blue-200 mx-px rounded-t"></div>
        <div className="flex-1 h-4 bg-blue-200 mx-px rounded-t"></div>
        <div className="flex-1 h-14 bg-blue-200 mx-px rounded-t"></div>
        <div className="flex-1 h-12 bg-blue-200 mx-px rounded-t"></div>
        <div className="flex-1 h-6 bg-blue-200 mx-px rounded-t"></div>
        <div className="flex-1 h-16 bg-blue-200 mx-px rounded-t"></div>
        <div className="flex-1 h-9 bg-blue-200 mx-px rounded-t"></div>
        <div className="flex-1 h-11 bg-blue-200 mx-px rounded-t"></div>
        <div className="flex-1 h-20 bg-blue-200 mx-px rounded-t"></div>
        <div className="flex-1 h-10 bg-blue-200 mx-px rounded-t"></div>
      </div>
    </div>
  </div>
);

export default GitHubMetricsCard;
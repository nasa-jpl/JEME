// src/components/charts/JournalDistributionCard.js
// Card showing journal distribution

import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import journalData from '../../data/journalData';

const JournalDistributionCard = () => (
  <div className="bg-white rounded-lg p-5 shadow-sm h-full">
    <div className="flex justify-between items-start mb-4">
      <div>
        <div className="text-base font-semibold text-gray-800">Journal Distribution</div>
        <div className="text-sm text-gray-500 mt-1">Top journals citing RAPID</div>
      </div>
      <button className="text-gray-500 hover:text-gray-700 p-1"><MoreHorizontal size={18} /></button>
    </div>
    
    <div className="space-y-2">
      {journalData.map((journal, index) => (
        <div key={index} className="flex justify-between items-center p-2 border-b border-gray-200">
          <div className="text-sm text-gray-700">{journal.name}</div>
          <div className="text-sm font-semibold text-gray-800">{journal.count}</div>
        </div>
      ))}
    </div>
    
    <div className="bg-gray-100 rounded-lg p-4 mt-4">
      <div className="text-sm font-semibold text-gray-700 mb-2">Journal Impact Analysis</div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-600">
          <div>High-impact journals (IF {'>'} 4)</div>
          <div className="font-medium">21 citations</div>
        </div>
        <div className="flex justify-between text-xs text-gray-600">
          <div>Medium-impact journals</div>
          <div className="font-medium">31 citations</div>
        </div>
        <div className="flex justify-between text-xs text-gray-600">
          <div>Specialized journals</div>
          <div className="font-medium">11 citations</div>
        </div>
      </div>
    </div>
  </div>
);

export default JournalDistributionCard;
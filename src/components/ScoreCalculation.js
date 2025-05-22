// src/components/ScoreCalculation.js
// Component for displaying score calculation details

import React from 'react';

const ScoreCalculation = ({ title, items }) => (
  <div className="bg-gray-100 rounded-lg p-4 mt-4">
    <div className="text-sm font-semibold text-gray-700 mb-2">{title}</div>
    {items.map((item, index) => (
      <div key={index} className={`flex justify-between py-1 text-xs text-gray-600 ${index < items.length - 1 ? 'border-b border-dashed border-gray-200' : ''} ${index === items.length - 1 ? 'font-semibold text-gray-800 mt-2' : ''}`}>
        <div>{item.factor}</div>
        {item.weight && <div className="text-center text-gray-500">{item.weight}</div>}
        <div className="text-right font-medium">{item.score}</div>
      </div>
    ))}
  </div>
);

export default ScoreCalculation;
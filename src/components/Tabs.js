// src/components/Tabs.js
// Navigation tabs component

import React from 'react';

const Tabs = () => (
  <div className="flex border-b border-gray-200 mb-6">
    <div className="px-6 py-3 text-sm font-medium text-blue-600 border-b-2 border-blue-600">Overview</div>
    <div className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-800 hover:border-b-2 hover:border-gray-300">Citation Analysis</div>
    <div className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-800 hover:border-b-2 hover:border-gray-300">Geographic Impact</div>
    <div className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-800 hover:border-b-2 hover:border-gray-300">Research Domains</div>
    <div className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-800 hover:border-b-2 hover:border-gray-300">Model Extensions</div>
  </div>
);

export default Tabs;
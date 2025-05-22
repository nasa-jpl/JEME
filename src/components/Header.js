// src/components/Header.js
// Dashboard header component

import React from 'react';
import { Filter, Calendar, Download } from 'lucide-react';

const Header = () => (
  <div className="flex justify-between items-center mb-6">
    <div>
      <h2 className="text-xl font-semibold text-gray-900">RAPID Model Citation Impact</h2>
      <div className="text-sm text-gray-500">Last updated: May 03, 2025</div>
    </div>
    <div className="flex gap-3">
      <button className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-100">
        <Filter size={16} />
        <span>Filter</span>
      </button>
      <button className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-100">
        <Calendar size={16} />
        <span>Date Range</span>
      </button>
      <button className="flex items-center gap-2 px-3 py-2 rounded-md bg-blue-600 text-sm font-medium text-white hover:bg-blue-700">
        <Download size={16} />
        <span>Export Report</span>
      </button>
    </div>
  </div>
);

export default Header;
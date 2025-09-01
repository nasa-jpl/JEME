// src/components/Header.js
// Dashboard header component

import React from 'react';

const Header = ({ modelName = 'RAPID' }) => {
  const today = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: '2-digit' 
  });

  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{modelName} Model Dashboard</h2>
        <div className="text-sm text-gray-500">Last updated: {today}</div>
      </div>
    </div>
  );
};

export default Header;
// src/components/Footer.js
// Footer component

import React from 'react';

const Footer = ({ isJEOE = false }) => {
  const now = new Date();
  const year = now.getFullYear();
  const lastUpdated = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: '2-digit'
  });

  return (
    <div className="text-center py-6 text-sm text-gray-500 border-t border-gray-200 mt-8">
      <div>© {year} {isJEOE ? 'JEOE' : 'JEME'} Dashboard</div>
      <div className="mt-2">Last updated: {lastUpdated}</div>
    </div>
  );
};

export default Footer;
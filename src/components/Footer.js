// src/components/Footer.js
// Footer component

import React from 'react';

const Footer = () => {
  const today = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: '2-digit' 
  });

  return (
    <div className="text-center py-6 text-sm text-gray-500 border-t border-gray-200 mt-8">
      <div>© 2025 JEME Publication Dashboard</div>
      <div className="mt-2">Last updated: {today}</div>
    </div>
  );
};

export default Footer;
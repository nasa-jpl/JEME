// src/components/Footer.js
// Footer component

import React from 'react';

const Footer = ({ isJEOE = false }) => {
  const year = new Date().getFullYear();

  return (
    <div className="text-center py-6 text-sm text-gray-500 border-t border-gray-200 mt-8">
      <div>© {year} {isJEOE ? 'JEOE' : 'JEME'} Dashboard</div>
    </div>
  );
};

export default Footer;
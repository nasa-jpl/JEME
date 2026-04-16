// src/components/Footer.js
// Footer component

import React from 'react';

const Footer = ({ isJEOE = false }) => {
  const year = new Date().getFullYear();

  return (
    <div className="text-center py-6 text-sm text-gray-500 border-t border-gray-200 mt-8">
      <div>© {year} {isJEOE ? 'JEOE' : 'JEME'} Dashboard</div>
      <div className="mt-3 max-w-3xl mx-auto text-xs text-gray-400 leading-relaxed">
        <p>
          Copyright 2026, by the California Institute of Technology. ALL RIGHTS RESERVED.
          United States Government Sponsorship acknowledged. Any commercial use must be
          negotiated with the Office of Technology Transfer at the California Institute of Technology.
        </p>
        <p className="mt-1">
          This software may be subject to U.S. export control laws. By accepting this software,
          the user agrees to comply with all applicable U.S. export laws and regulations. User has
          the responsibility to obtain export licenses, or other export authority as may be required
          before exporting such information to foreign countries or providing access to foreign persons.
        </p>
      </div>
    </div>
  );
};

export default Footer;
// src/components/Header.js
// Dashboard header component
//
// "Last updated" reflects the file mtime of the model's _analyzed.json file
// (parsed from the HTTP Last-Modified header), so it changes only when the
// underlying data is regenerated — not on every page load.

import React, { useState, useEffect } from 'react';

const MISSIONS = ['GRACE', 'SWOT', 'TROPESS'];

const formatDate = (date) =>
  date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
  });

const Header = ({ modelName = 'RAPID' }) => {
  const [lastUpdated, setLastUpdated] = useState(null);
  const isMission = MISSIONS.includes(modelName);

  useEffect(() => {
    let cancelled = false;
    const url = `${process.env.PUBLIC_URL}/data/${modelName}_analyzed.json`;
    fetch(url, { method: 'HEAD' })
      .then((res) => {
        if (!res.ok) return null;
        const header = res.headers.get('Last-Modified');
        if (!header) return null;
        const parsed = new Date(header);
        return isNaN(parsed.getTime()) ? null : parsed;
      })
      .then((date) => {
        if (!cancelled) setLastUpdated(date);
      })
      .catch(() => {
        if (!cancelled) setLastUpdated(null);
      });
    return () => {
      cancelled = true;
    };
  }, [modelName]);

  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{modelName} {isMission ? '' : 'Model '}Dashboard</h2>
        <div className="text-sm text-gray-500">
          Last updated: {lastUpdated ? formatDate(lastUpdated) : '—'}
        </div>
      </div>
    </div>
  );
};

export default Header;

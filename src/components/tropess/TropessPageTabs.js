// src/components/tropess/TropessPageTabs.js
// Switcher between the two TROPESS pages, which serve different audiences:
//   - Data Products & Downloads (data users)  -> /TROPESS/data-products
//   - Publications & Citations (science impact) -> /TROPESS
//
// `active` is either 'data-products' or 'publications'.

import React from 'react';
import { Link } from 'react-router-dom';
import { Download, BookOpen } from 'lucide-react';

const TABS = [
  {
    key: 'data-products',
    to: '/TROPESS/data-products',
    label: 'Data Products & Downloads',
    sub: 'Published products, download metrics, and user geography',
    icon: Download,
  },
  {
    key: 'publications',
    to: '/TROPESS',
    label: 'Paper Publications',
    sub: 'Citations, research domains, and science impact',
    icon: BookOpen,
  },
];

const TropessPageTabs = ({ active }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
    {TABS.map(({ key, to, label, sub, icon: Icon }) => {
      const isActive = key === active;
      return (
        <Link
          key={key}
          to={to}
          aria-current={isActive ? 'page' : undefined}
          className={`flex items-start gap-3 p-4 rounded-lg border transition-all duration-200 ${
            isActive
              ? 'bg-sky-50 border-sky-300 shadow-sm'
              : 'bg-white border-gray-200 hover:border-sky-300 hover:shadow-md'
          }`}
        >
          <div className={`p-2 rounded-lg ${isActive ? 'bg-sky-100' : 'bg-gray-50'}`}>
            <Icon size={20} className={isActive ? 'text-sky-600' : 'text-gray-500'} />
          </div>
          <div className="min-w-0">
            <div className={`font-semibold ${isActive ? 'text-sky-900' : 'text-gray-900'}`}>
              {label}
            </div>
            <div className="text-sm text-gray-600 mt-0.5 leading-relaxed">{sub}</div>
          </div>
        </Link>
      );
    })}
  </div>
);

export default TropessPageTabs;

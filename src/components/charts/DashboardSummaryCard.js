// src/components/charts/DashboardSummaryCard.js
// Summary card with key metrics

import React from 'react';
import { Download } from 'lucide-react';

// Component to create summary sections
const SummarySection = ({ title, items }) => (
  <>
    <div className="text-sm font-semibold text-gray-800 mb-3">{title}</div>
    <div className="bg-gray-100 rounded-lg p-4">
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex justify-between text-sm">
            <div className="text-gray-600">{item.label}</div>
            <div className="text-gray-800 font-medium">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  </>
);

const DashboardSummaryCard = () => {
  // Citation summary items
  const citationSummaryItems = [
    { label: "Total Citations", value: "265" },
    { label: "Average Annual Growth", value: "19.6 citations/year" },
    { label: "Current Year-to-Date", value: "21 citations (Q2 2025)" },
    { label: "Peak Citation Year", value: "2023 (35 citations)" },
    { label: "Citation Quality Index", value: "Medium-High" }
  ];
  
  // Research impact items
  const researchImpactItems = [
    { label: "Implementation Score", value: "34.7%" },
    { label: "High-Engagement Citations", value: "40 papers (Levels 3-4)" },
    { label: "Geographic Reach", value: "48 watersheds in 17 countries" },
    { label: "Educational Impact", value: "31 academic theses" }
  ];
  
  // Domain impact items
  const domainImpactItems = [
    { label: "Primary Domain", value: "River Modeling (114 papers)" },
    { label: "Cross-Disciplinary Reach", value: "5 major research domains" },
    { label: "Model Extensions", value: "4 major adaptations" },
    { label: "Research Focus Areas", value: "Flood prediction, Flow analysis" }
  ];
  
  // Recommendations items
  const recommendationsItems = [
    { label: "Monitor", value: "Streamflow modeling applications" },
    { label: "Highlight", value: "Flood prediction applications" },
    { label: "Explore", value: "Water resources management" },
    { label: "Showcase", value: "River network modeling capabilities" }
  ];
  
  return (
    <div className="bg-white rounded-lg p-5 shadow-sm mb-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-base font-semibold text-gray-800">Dashboard Summary</div>
          <div className="text-sm text-gray-500 mt-1">Key insights and metrics at a glance</div>
        </div>
        <button className="text-gray-500 hover:text-gray-700 p-1">
          <Download size={18} />
        </button>
      </div>
      
      <div className="flex">
        <div className="flex-1 pr-6">
          <SummarySection title="Citation Summary" items={citationSummaryItems} />
          
          <div className="mt-6">
            <SummarySection title="Research Impact" items={researchImpactItems} />
          </div>
        </div>
        
        <div className="flex-1 pl-6 border-l border-gray-200">
          <SummarySection title="Domain Impact" items={domainImpactItems} />
          
          <div className="mt-6">
            <SummarySection title="Recommendations" items={recommendationsItems} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSummaryCard;
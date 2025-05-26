// src/components/charts/DashboardSummaryCard.js
// Summary card with key metrics based on real RAPID citation data

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
  // Citation summary items (based on real data analysis)
  const citationSummaryItems = [
    { label: "Total Publications", value: "265" },
    { label: "Total Citation Impact", value: "8,684 citations" },
    { label: "Average Citations/Paper", value: "32.8" },
    { label: "Peak Publication Year", value: "2023 (35 papers)" },
    { label: "2025 Publications", value: "15 papers (YTD)" }
  ];
  
  // Research impact items (based on engagement analysis)
  const researchImpactItems = [
    { label: "Implementation Score", value: "51.0%" },
    { label: "High-Engagement Studies", value: "133 papers (Levels 3-4)" },
    { label: "Geographic Reach", value: "37 countries, 63 watersheds" },
    { label: "Academic Impact", value: "25 theses/dissertations" }
  ];
  
  // Domain impact items (based on research domain analysis)
  const domainImpactItems = [
    { label: "Primary Domain", value: "Flood Prediction (48 papers)" },
    { label: "Secondary Domain", value: "River Modeling (34 papers)" },
    { label: "Cross-Disciplinary Reach", value: "8+ research domains" },
    { label: "Top Applications", value: "Streamflow, Hydrologic modeling" }
  ];
  
  // Key insights and recommendations
  const recommendationsItems = [
    { label: "Strength", value: "Flood prediction applications" },
    { label: "Growth Area", value: "Water resources management" },
    { label: "Geographic Focus", value: "Mississippi, Ganges basins" },
    { label: "Academic Adoption", value: "Strong thesis integration" }
  ];
  
  return (
    <div className="bg-white rounded-lg p-5 shadow-sm mb-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-base font-semibold text-gray-800">RAPID Model Impact Dashboard</div>
          <div className="text-sm text-gray-500 mt-1">Citation analysis and research impact metrics</div>
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
            <SummarySection title="Key Insights" items={recommendationsItems} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSummaryCard;
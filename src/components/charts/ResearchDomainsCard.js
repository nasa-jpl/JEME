// src/components/charts/ResearchDomainsCard.js
// Chart showing research domains distribution

import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { MoreHorizontal } from 'lucide-react';
import colors from '../../utils/colors';

// Import the JSON data directly
import citationsData from '../../views/rapid_20250528_2.json';

const ResearchDomainsCard = () => {
  // Process the research domains data
  const domainData = useMemo(() => {
    // Count papers by research domain
    const domainCounts = {};
    
    citationsData.forEach(paper => {
      const domain = paper.research_domain;
      if (domain && domain !== "Unknown" && domain !== "Not specified") {
        domainCounts[domain] = (domainCounts[domain] || 0) + 1;
      }
    });

    // Convert to array and sort by count
    const domainArray = Object.entries(domainCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Calculate total for percentages
    const total = domainArray.reduce((sum, item) => sum + item.value, 0);

    // Define colors for different domains
    const domainColors = [
      '#3B82F6', // Blue
      '#EF4444', // Red  
      '#10B981', // Green
      '#F59E0B', // Amber
      '#8B5CF6', // Purple
      '#06B6D4', // Cyan
      '#F97316', // Orange
      '#EC4899', // Pink
      '#84CC16', // Lime
      '#6366F1', // Indigo
      '#14B8A6', // Teal
      '#F472B6', // Rose
    ];

    // Add colors and percentages
    const processedData = domainArray.map((item, index) => ({
      ...item,
      color: domainColors[index % domainColors.length],
      percentage: ((item.value / total) * 100).toFixed(1)
    }));

    // Take top 10 domains to avoid overcrowding
    return processedData.slice(0, 10);
  }, []);

  // Calculate total papers in displayed domains
  const totalDisplayed = domainData.reduce((sum, item) => sum + item.value, 0);
  const totalDomains = useMemo(() => {
    const uniqueDomains = new Set();
    citationsData.forEach(paper => {
      if (paper.research_domain && 
          paper.research_domain !== "Unknown" && 
          paper.research_domain !== "Not specified") {
        uniqueDomains.add(paper.research_domain);
      }
    });
    return uniqueDomains.size;
  }, []);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            {`${data.value} papers (${data.percentage}%)`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm h-full">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-base font-semibold text-gray-800">Research Domains</div>
          <div className="text-sm text-gray-500 mt-1">
            Distribution across fields • {totalDomains} total domains
          </div>
        </div>
        <button className="text-gray-500 hover:text-gray-700 p-1">
          <MoreHorizontal size={18} />
        </button>
      </div>
      
      <div className="h-56 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={domainData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              label={({cx, cy, midAngle, innerRadius, outerRadius, percent}) => {
                const radius = innerRadius + (outerRadius - innerRadius) * 1.3;
                const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                return percent > 0.05 ? ( // Show label if > 5%
                  <text 
                    x={x} 
                    y={y} 
                    fill={colors.gray700 || "#374151"} 
                    textAnchor="middle" 
                    dominantBaseline="middle" 
                    fontSize={11} 
                    fontWeight={500}
                  >
                    {`${(percent * 100).toFixed(0)}%`}
                  </text>
                ) : null;
              }}
            >
              {domainData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Center text showing total */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center" style={{ marginTop: '-60px' }}>
          <div className="text-2xl font-bold text-gray-900">
            {totalDisplayed}
          </div>
          <div className="text-xs text-gray-500">Papers</div>
        </div>
      </div>
      
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {domainData.map((item, index) => (
          <div key={index} className="flex items-center">
            <div className="flex-1">
              <div className="flex items-center mb-1">
                <div 
                  className="w-3 h-3 rounded-full mr-2 flex-shrink-0" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <div className="text-sm font-medium text-gray-800 truncate" title={item.name}>
                  {item.name}
                </div>
              </div>
              <div className="ml-5">
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-300" 
                    style={{ 
                      width: `${item.percentage}%`, 
                      backgroundColor: item.color 
                    }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="text-sm font-semibold text-gray-700 ml-4 w-12 text-right">
              {item.value}
            </div>
            <div className="text-xs text-gray-500 ml-2 w-10 text-right">
              {item.percentage}%
            </div>
          </div>
        ))}
      </div>
      
      {/* Additional statistics */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {domainData.length}
            </div>
            <div className="text-xs text-gray-500">Top Domains</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {totalDisplayed}
            </div>
            <div className="text-xs text-gray-500">Total Papers</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {domainData.length > 0 ? domainData[0].percentage : 0}%
            </div>
            <div className="text-xs text-gray-500">Largest Domain</div>
          </div>
        </div>
        
        {/* Show top domain name */}
        {domainData.length > 0 && (
          <div className="mt-2 text-center">
            <div className="text-xs text-gray-600">
              Top domain: <span className="font-medium">{domainData[0].name}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResearchDomainsCard;
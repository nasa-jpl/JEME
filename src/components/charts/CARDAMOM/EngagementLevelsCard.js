// src/components/charts/EngagementLevelsCard.js
// Chart showing engagement level distribution

import React, { useMemo } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MoreHorizontal } from 'lucide-react';

// Import the JSON data directly
import citationsData from '../../../views/rapid_20250528_2.json';

const EngagementLevelsCard = () => {
  // Process the engagement levels data
  const engagementData = useMemo(() => {
    // Count papers by engagement level
    const engagementCounts = {};
    
    citationsData.forEach(paper => {
      const level = paper.engagement_level;
      if (level && level !== "Unknown" && level !== "Not specified") {
        engagementCounts[level] = (engagementCounts[level] || 0) + 1;
      } else {
        // Handle papers without engagement level classification
        engagementCounts["Unclassified"] = (engagementCounts["Unclassified"] || 0) + 1;
      }
    });

    // Define engagement level order and colors
    const levelOrder = [
      "Level 1: Simple Citation",
      "Level 2: Data Usage", 
      "Level 3: Model Adaptation",
      "Level 4: Foundational Method",
      "Unclassified"
    ];

    const levelColors = {
      "Level 1: Simple Citation": "#93C5FD",     // Light blue
      "Level 2: Data Usage": "#60A5FA",          // Blue
      "Level 3: Model Adaptation": "#3B82F6",    // Darker blue
      "Level 4: Foundational Method": "#1D4ED8", // Dark blue
      "Unclassified": "#D1D5DB"                  // Gray
    };

    // Create ordered array with proper names and colors
    const processedData = levelOrder
      .map(level => {
        const count = engagementCounts[level] || 0;
        let displayName = level;
        
        // Shorten names for better display
        if (level.includes("Level 1")) displayName = "L1: Citation";
        else if (level.includes("Level 2")) displayName = "L2: Data Usage";
        else if (level.includes("Level 3")) displayName = "L3: Adaptation";
        else if (level.includes("Level 4")) displayName = "L4: Foundation";
        else if (level === "Unclassified") displayName = "Unclassified";
        
        return {
          name: displayName,
          fullName: level,
          value: count,
          color: levelColors[level],
          percentage: count > 0 ? ((count / citationsData.length) * 100).toFixed(1) : "0.0"
        };
      })
      .filter(item => item.value > 0); // Only show levels that have papers

    return processedData;
  }, []);

  // Calculate total classified papers
  const totalClassified = engagementData
    .filter(item => item.fullName !== "Unclassified")
    .reduce((sum, item) => sum + item.value, 0);

  const unclassifiedCount = engagementData.find(item => item.fullName === "Unclassified")?.value || 0;

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg max-w-xs">
          <p className="font-medium text-gray-900">{data.fullName}</p>
          <p className="text-sm text-gray-600">
            {`${data.value} papers (${data.percentage}%)`}
          </p>
          {data.fullName !== "Unclassified" && (
            <p className="text-xs text-gray-500 mt-1">
              {getEngagementDescription(data.fullName)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Helper function to get engagement level descriptions
  const getEngagementDescription = (level) => {
    const descriptions = {
      "Level 1: Simple Citation": "References the paper without using the model directly",
      "Level 2: Data Usage": "Uses RAPID methodology, data, or outputs in their research", 
      "Level 3: Model Adaptation": "Modifies, extends, or adapts the RAPID model for their needs",
      "Level 4: Foundational Method": "RAPID is foundational or central to their research methodology"
    };
    return descriptions[level] || "";
  };

  // Calculate engagement quality score (weighted average)
  const calculateEngagementScore = () => {
    const weights = {
      "Level 1: Simple Citation": 1,
      "Level 2: Data Usage": 2,
      "Level 3: Model Adaptation": 3,
      "Level 4: Foundational Method": 4
    };

    let totalWeightedScore = 0;
    let totalPapers = 0;

    engagementData.forEach(item => {
      if (item.fullName !== "Unclassified") {
        const weight = weights[item.fullName] || 0;
        totalWeightedScore += weight * item.value;
        totalPapers += item.value;
      }
    });

    return totalPapers > 0 ? (totalWeightedScore / totalPapers).toFixed(1) : "0.0";
  };

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm h-full">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-base font-semibold text-gray-800">Engagement Level Distribution</div>
          <div className="text-sm text-gray-500 mt-1">
            How deeply is RAPID being utilized in research? • {citationsData.length} total papers
          </div>
        </div>
        <button className="text-gray-500 hover:text-gray-700 p-1">
          <MoreHorizontal size={18} />
        </button>
      </div>
      
      <div className="h-64 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={engagementData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis 
              type="number" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => value.toString()}
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={90} 
              tick={{ fontSize: 11 }} 
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="value" 
              radius={[0, 4, 4, 0]}
              stroke="#ffffff"
              strokeWidth={1}
            >
              {engagementData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Engagement Statistics */}
      <div className="mb-4">
        
        {/* Progress indicators for each level */}
        <div className="space-y-2">
          {engagementData.filter(item => item.fullName !== "Unclassified").map((item, index) => (
            <div key={index} className="flex items-center">
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-gray-700">{item.name}</span>
                  <span className="text-xs text-gray-500">{item.value} papers</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
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
          ))}
        </div>
      </div>
      
      <div className="bg-gray-100 rounded-lg p-4">
        <div className="text-sm font-semibold text-gray-700 mb-2">Engagement Level Definitions</div>
        <div className="space-y-1 text-xs text-gray-600">
          <div className="flex justify-between py-1 border-b border-dashed border-gray-200">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: "#93C5FD" }}></div>
              <span>Level 1: Simple Citation</span>
            </div>
            <div className="text-right max-w-xs">References the paper without using the model</div>
          </div>
          <div className="flex justify-between py-1 border-b border-dashed border-gray-200">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: "#60A5FA" }}></div>
              <span>Level 2: Data Usage</span>
            </div>
            <div className="text-right max-w-xs">Uses RAPID methodology or data</div>
          </div>
          <div className="flex justify-between py-1 border-b border-dashed border-gray-200">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: "#3B82F6" }}></div>
              <span>Level 3: Model Adaptation</span>
            </div>
            <div className="text-right max-w-xs">Modifies or extends the RAPID model</div>
          </div>
          <div className="flex justify-between py-1">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: "#1D4ED8" }}></div>
              <span>Level 4: Foundation</span>
            </div>
            <div className="text-right max-w-xs">RAPID is foundational to the research</div>
          </div>
        </div>
        
        {unclassifiedCount > 0 && (
          <div className="mt-3 pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              <span className="font-medium">{unclassifiedCount} papers</span> are not yet classified by engagement level
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EngagementLevelsCard;
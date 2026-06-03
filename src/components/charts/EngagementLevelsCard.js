// src/components/charts/EngagementLevelsCard.js
// Chart showing engagement level distribution

import React, { useMemo } from 'react';
import { MoreHorizontal } from 'lucide-react';

const EngagementLevelsCard = ({ data }) => {
  // Process the engagement levels data
  const engagementData = useMemo(() => {
    // Count papers by engagement level
    const engagementCounts = {};

    // Use provided data or empty array as fallback
    const citationsData = data || [];

    // Detect whether data uses mission format or model format
    let isMissionFormat = false;

    citationsData.forEach(paper => {
      const level = paper.engagement_level;
      if (level === "Data Usage" || level === "Review Paper") {
        isMissionFormat = true;
      }
    });

    citationsData.forEach(paper => {
      const level = paper.engagement_level;
      if (level && level !== "Unknown" && level !== "Not specified") {
        let standardLevel = "Unclassified";

        if (isMissionFormat) {
          // Mission format
          if (level === "Data Usage") standardLevel = "Data Usage";
          else if (level === "Review Paper") standardLevel = "Review Paper";
          else if (level === "Citation" || level === "Simple Citation") standardLevel = "Citation";
        } else {
          // Model format: Level 1–4 (match by prefix to handle any suffix text)
          if (level === "Citation") {
            standardLevel = "Level 1: Citation";
          } else if (level.startsWith("Level 1:") || level.startsWith("Level 1 ")) {
            standardLevel = "Level 1: Citation";
          } else if (level.startsWith("Level 2:") || level.startsWith("Level 2 ")) {
            standardLevel = "Level 2: Data Usage";
          } else if (level.startsWith("Level 3:") || level.startsWith("Level 3 ")) {
            standardLevel = "Level 3: Model Adaptation";
          }
        }

        engagementCounts[standardLevel] = (engagementCounts[standardLevel] || 0) + 1;
      } else {
        engagementCounts["Unclassified"] = (engagementCounts["Unclassified"] || 0) + 1;
      }
    });

    // Define engagement level order and colors based on format
    const levelOrder = isMissionFormat
      ? ["Citation", "Data Usage", "Review Paper", "Unclassified"]
      : ["Level 1: Citation", "Level 2: Data Usage", "Level 3: Model Adaptation", "Unclassified"];

    const levelColors = isMissionFormat
      ? {
          "Citation": "#93C5FD",            // Light blue
          "Data Usage": "#3B82F6",          // Blue
          "Review Paper": "#1D4ED8",        // Dark blue
          "Unclassified": "#D1D5DB"         // Gray
        }
      : {
          "Level 1: Citation": "#93C5FD",
          "Level 2: Data Usage": "#60A5FA",
          "Level 3: Model Adaptation": "#1D4ED8",
          "Unclassified": "#D1D5DB"
        };

    // Create ordered array with proper names and colors
    const processedData = levelOrder
      .map(level => {
        const count = engagementCounts[level] || 0;
        let displayName = level;

        // Shorten names for better display
        if (isMissionFormat) {
          // Mission format names are already short enough
        } else {
          if (level === "Level 1: Citation") displayName = "L1: Citation";
          else if (level === "Level 2: Data Usage") displayName = "L2: Data Usage";
          else if (level === "Level 3: Model Adaptation") displayName = "L3: Model Adaptation";
        }

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
  }, [data]);

  const unclassifiedCount = engagementData.find(item => item.fullName === "Unclassified")?.value || 0;

  // Custom tooltip
  // Helper function to get engagement level descriptions
  const getEngagementDescription = (level) => {
    const descriptions = {
      "Level 1: Citation": "Cites the model as background without direct use",
      "Citation": "Mentions or cites mission products in passing without direct data use",
      "Level 2: Data Usage": "Uses model outputs or datasets only",
      "Level 3: Model Adaptation": "Uses, modifies, extends, or couples the model or methodology",
      "Data Usage": "Uses mission data or products in analysis",
      "Review Paper": "Review, survey, or overview paper"
    };
    return descriptions[level] || "";
  };

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm h-full">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-base font-semibold text-gray-800">Engagement Level Distribution</div>
          <div className="text-sm text-gray-500 mt-1">
            Engagement depth among all peer-reviewed papers citing this model/mission • {(data || []).length} total papers
          </div>
        </div>
        <button className="text-gray-500 hover:text-gray-700 p-1">
          <MoreHorizontal size={18} />
        </button>
      </div>

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
          {engagementData.filter(item => item.fullName !== "Unclassified").map((item, index, arr) => (
            <div key={item.fullName} className={`flex justify-between py-1 ${index < arr.length - 1 ? 'border-b border-dashed border-gray-200' : ''}`}>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                <span>{item.fullName}</span>
              </div>
              <div className="text-right max-w-xs">{getEngagementDescription(item.fullName)}</div>
            </div>
          ))}
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

// src/components/charts/JournalDistributionCard.js
// Card showing journal distribution

import React, { useMemo } from 'react';
import { MoreHorizontal } from 'lucide-react';

// Import the JSON data directly
import citationsData from '../../../views/rapid_20250528_2.json';

const JournalDistributionCard = () => {
  // Process the journal distribution data
  const journalData = useMemo(() => {
    // Helper function to decode HTML entities
    const decodeHtmlEntities = (text) => {
      if (!text) return text;
      const textarea = document.createElement('textarea');
      textarea.innerHTML = text;
      return textarea.value;
    };

    // Helper function to check if a name is a valid journal
    const isValidJournal = (name) => {
      if (!name || name === 'Unknown Journal') return false;
      
      // Filter out non-journal entries
      const invalidEntries = [
        'crossref',
        'doi',
        'preprint',
        'arxiv',
        'researchgate',
        'academia.edu',
        'unknown',
        'not specified',
        'n/a',
        'na',
        'null',
        'undefined'
      ];
      
      const nameLower = name.toLowerCase().trim();
      return !invalidEntries.some(invalid => nameLower.includes(invalid));
    };

    // Helper function to extract journal name
    const extractJournalName = (paper) => {
      let journalName = null;
      
      // Try different fields for journal name
      if (paper['container-title'] && Array.isArray(paper['container-title']) && paper['container-title'][0]) {
        journalName = paper['container-title'][0];
      } else if (paper.journal && paper.journal.name) {
        journalName = paper.journal.name;
      } else if (paper.journal && typeof paper.journal === 'string') {
        journalName = paper.journal;
      } else if (paper.source) {
        journalName = paper.source;
      } else if (paper['journal-title']) {
        journalName = paper['journal-title'];
      } else {
        return null; // Return null for filtering
      }
      
      // Decode HTML entities
      const decodedName = decodeHtmlEntities(journalName);
      
      // Check if it's a valid journal
      return isValidJournal(decodedName) ? decodedName : null;
    };

    // Count papers by journal
    const journalCounts = {};
    
    citationsData.forEach(paper => {
      const journalName = extractJournalName(paper);
      if (journalName) { // Only count valid journals
        journalCounts[journalName] = (journalCounts[journalName] || 0) + 1;
      }
    });

    // Convert to array and sort by count
    const journalArray = Object.entries(journalCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Take top 15 journals to avoid overcrowding
    return journalArray.slice(0, 15);
  }, []);

  // Calculate journal impact analysis
  const impactAnalysis = useMemo(() => {
    // Define high-impact journals (simplified list of well-known high-impact journals)
    const highImpactJournals = new Set([
      'Nature',
      'Science',
      'Nature Communications',
      'Nature Climate Change',
      'Nature Geoscience',
      'Science Advances',
      'Proceedings of the National Academy of Sciences',
      'Journal of Geophysical Research',
      'Geophysical Research Letters',
      'Water Resources Research',
      'Journal of Hydrology',
      'Hydrology and Earth System Sciences',
      'Environmental Research Letters',
      'Earth System Dynamics',
      'Scientific Reports'
    ]);

    // Define medium-impact journals (domain-specific but reputable)
    const mediumImpactJournals = new Set([
      'Journal of Hydrometeorology',
      'International Journal of Climatology',
      'Climate Dynamics',
      'Journal of Climate',
      'Atmospheric Chemistry and Physics',
      'Hydrological Processes',
      'Journal of Atmospheric and Oceanic Technology',
      'Computers & Geosciences',
      'Environmental Modelling & Software',
      'International Journal of Geographical Information Science'
    ]);

    let highImpactCount = 0;
    let mediumImpactCount = 0;
    let specializedCount = 0;

    // Helper function to check if journal name matches any in a set (case-insensitive partial match)
    const matchesJournalSet = (journalName, journalSet) => {
      const nameLower = journalName.toLowerCase();
      return Array.from(journalSet).some(journal => 
        nameLower.includes(journal.toLowerCase()) || journal.toLowerCase().includes(nameLower)
      );
    };

    citationsData.forEach(paper => {
      const journalName = paper['container-title'] && Array.isArray(paper['container-title']) 
        ? paper['container-title'][0] 
        : paper.source || paper.journal || 'Unknown';

      if (journalName && journalName !== 'Unknown') {
        if (matchesJournalSet(journalName, highImpactJournals)) {
          highImpactCount++;
        } else if (matchesJournalSet(journalName, mediumImpactJournals)) {
          mediumImpactCount++;
        } else {
          specializedCount++;
        }
      }
    });

    return {
      highImpact: highImpactCount,
      mediumImpact: mediumImpactCount,
      specialized: specializedCount,
      total: highImpactCount + mediumImpactCount + specializedCount
    };
  }, []);

  // Calculate journal diversity metrics
  const diversityMetrics = useMemo(() => {
    const totalJournals = journalData.length;
    const totalPapers = journalData.reduce((sum, journal) => sum + journal.count, 0);
    const topJournalShare = totalPapers > 0 && journalData.length > 0 
      ? ((journalData[0].count / totalPapers) * 100).toFixed(1)
      : 0;
    
    // Calculate concentration (what percentage of papers are in top 5 journals)
    const top5Papers = journalData.slice(0, 5).reduce((sum, journal) => sum + journal.count, 0);
    const concentration = totalPapers > 0 
      ? ((top5Papers / totalPapers) * 100).toFixed(1)
      : 0;

    return {
      totalJournals,
      totalPapers,
      topJournalShare,
      concentration
    };
  }, [journalData]);

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm h-full">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-base font-semibold text-gray-800">Journal Distribution</div>
          <div className="text-sm text-gray-500 mt-1">
            Top journals citing RAPID • {diversityMetrics.totalJournals} unique journals
          </div>
        </div>
        <button className="text-gray-500 hover:text-gray-700 p-1">
          <MoreHorizontal size={18} />
        </button>
      </div>
      
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {journalData.map((journal, index) => (
          <div key={index} className="flex justify-between items-center p-2 border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <div className="flex items-center flex-1">
              <div className="w-6 h-4 bg-blue-100 rounded text-xs flex items-center justify-center text-blue-600 font-medium mr-3">
                {index + 1}
              </div>
              <div className="text-sm text-gray-700 flex-1 truncate" title={journal.name}>
                {journal.name}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold text-gray-800">
                {journal.count}
              </div>
              <div className="text-xs text-gray-500">
                {diversityMetrics.totalPapers > 0 
                  ? `${((journal.count / diversityMetrics.totalPapers) * 100).toFixed(1)}%`
                  : '0%'
                }
              </div>
            </div>
          </div>
        ))}
        
        {journalData.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <div className="text-sm">No journal data available</div>
            <div className="text-xs mt-1">Check if papers have journal information</div>
          </div>
        )}
      </div>
      
      {/* Journal Impact Analysis */}
      <div className="bg-gray-50 rounded-lg p-4 mt-4">
        <div className="text-sm font-semibold text-gray-700 mb-3">Journal Impact Analysis</div>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs text-gray-600">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span>High-impact journals (IF &gt; 4)</span>
            </div>
            <div className="font-medium text-gray-800">
              {impactAnalysis.highImpact} papers
            </div>
          </div>
          <div className="flex justify-between items-center text-xs text-gray-600">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              <span>Medium-impact journals</span>
            </div>
            <div className="font-medium text-gray-800">
              {impactAnalysis.mediumImpact} papers
            </div>
          </div>
          <div className="flex justify-between items-center text-xs text-gray-600">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
              <span>Specialized journals</span>
            </div>
            <div className="font-medium text-gray-800">
              {impactAnalysis.specialized} papers
            </div>
          </div>
        </div>
        
        {/* Progress bars for impact distribution */}
        <div className="mt-3 space-y-2">
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>High Impact</span>
              <span>{impactAnalysis.total > 0 ? ((impactAnalysis.highImpact / impactAnalysis.total) * 100).toFixed(0) : 0}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full">
              <div 
                className="h-full bg-green-500 rounded-full transition-all duration-300"
                style={{ 
                  width: impactAnalysis.total > 0 
                    ? `${(impactAnalysis.highImpact / impactAnalysis.total) * 100}%` 
                    : '0%' 
                }}
              ></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Medium Impact</span>
              <span>{impactAnalysis.total > 0 ? ((impactAnalysis.mediumImpact / impactAnalysis.total) * 100).toFixed(0) : 0}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ 
                  width: impactAnalysis.total > 0 
                    ? `${(impactAnalysis.mediumImpact / impactAnalysis.total) * 100}%` 
                    : '0%' 
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Journal Diversity Metrics */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {diversityMetrics.topJournalShare}%
            </div>
            <div className="text-xs text-gray-500">Top Journal Share</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {diversityMetrics.concentration}%
            </div>
            <div className="text-xs text-gray-500">Top 5 Concentration</div>
          </div>
        </div>
        
        {journalData.length > 0 && (
          <div className="mt-2 text-center">
            <div className="text-xs text-gray-600">
              Most active: <span className="font-medium">{journalData[0].name}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JournalDistributionCard;
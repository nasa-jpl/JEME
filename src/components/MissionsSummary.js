// src/components/MissionsSummary.js
// Component for displaying satellite missions and instruments summary

import React from 'react';
import { Satellite, Database, Radio, RefreshCw, HelpCircle } from 'lucide-react';
import { processMissionData, getAgencyColor } from '../utils/dataUtils';

const MissionsSummary = ({ citationsData, maxMissions = 8, showDetails = true }) => {
  const missionData = React.useMemo(() => {
    return processMissionData(citationsData);
  }, [citationsData]);

  if (missionData.totalMissions === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Satellite className="text-gray-400" size={20} />
          <h3 className="text-lg font-semibold text-gray-800">Missions & Instruments</h3>
        </div>
        <p className="text-gray-500 text-sm">
          No mission/instrument data available. Run the mission extraction script to populate this data.
        </p>
      </div>
    );
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Satellite':
        return <Satellite size={14} />;
      case 'Instrument':
      case 'Sensor':
        return <Radio size={14} />;
      case 'Data Product':
      case 'Reanalysis':
        return <Database size={14} />;
      case 'Model Output':
        return <RefreshCw size={14} />;
      default:
        return <HelpCircle size={14} />;
    }
  };

  const topMissions = missionData.topMissions.slice(0, maxMissions);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Satellite className="text-blue-600" size={20} />
          <h3 className="text-lg font-semibold text-gray-800">Missions & Instruments</h3>
        </div>
        <span className="text-sm text-gray-500">
          {missionData.papersWithMissions} of {citationsData?.length || 0} papers
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Satellite missions and instruments whose data was actively used in papers citing this model — not just mentioned, but integrated into the research methodology or analysis.
      </p>

      {/* Top Missions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700">
            Top {Math.min(maxMissions, topMissions.length)} Missions/Instruments
          </h4>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Satellite size={12} /> Satellite</span>
            <span className="flex items-center gap-1"><Radio size={12} /> Instrument</span>
            <span className="flex items-center gap-1"><Database size={12} /> Reanalysis</span>
            <span className="flex items-center gap-1"><RefreshCw size={12} /> Model</span>
          </div>
        </div>
        <div className="space-y-2">
          {topMissions.map((mission, index) => (
            <div
              key={mission.name}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-gray-400 text-sm w-5">{index + 1}.</span>
                <div
                  className="p-1.5 rounded"
                  style={{
                    backgroundColor: `${getAgencyColor(mission.agency)}15`,
                    color: getAgencyColor(mission.agency)
                  }}
                >
                  {getTypeIcon(mission.type)}
                </div>
                <div>
                  <div className="font-medium text-gray-900 text-sm">{mission.name}</div>
                  <div className="text-xs text-gray-500">
                    {mission.agency} • {mission.type}
                    {mission.products.length > 0 && (
                      <span className="ml-1">• {mission.products.slice(0, 2).join(', ')}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">{mission.count}</div>
                  <div className="text-xs text-gray-500">papers</div>
                </div>
                {/* Usage bar */}
                <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(mission.count / topMissions[0].count) * 100}%`,
                      backgroundColor: getAgencyColor(mission.agency)
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {missionData.topMissions.length > maxMissions && (
        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
          <span className="text-sm text-gray-500">
            +{missionData.topMissions.length - maxMissions} more missions
          </span>
        </div>
      )}
    </div>
  );
};

export default MissionsSummary;

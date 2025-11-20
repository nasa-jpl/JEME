// Network Insights Card - Key statistics about model connections
import React from 'react';
import { TrendingUp, Users, FileText, Link2, Network, Award } from 'lucide-react';
import { getModelConfig } from '../../config/modelConfig';

const NetworkInsightsCard = ({ summary, networkMetrics }) => {
  if (!summary) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-gray-500">Loading network insights...</div>
      </div>
    );
  }

  const {
    totalModels,
    totalPapers,
    totalBridgePapers,
    totalConnections,
    bridgePaperPercentage,
    mostConnectedModel,
    strongestConnection,
    topBridgePaper
  } = summary;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center mb-6">
        <Network className="text-blue-600 mr-3" size={28} />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Network Insights</h2>
          <p className="text-sm text-gray-600">Cross-model citation analysis across all scientific models</p>
        </div>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700">Total Models</span>
            <Network className="text-blue-500" size={20} />
          </div>
          <div className="text-3xl font-bold text-blue-900">{totalModels}</div>
          <div className="text-xs text-blue-600 mt-1">Scientific models analyzed</div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-700">Total Papers</span>
            <FileText className="text-green-500" size={20} />
          </div>
          <div className="text-3xl font-bold text-green-900">{totalPapers.toLocaleString()}</div>
          <div className="text-xs text-green-600 mt-1">Citations across all models</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-700">Bridge Papers</span>
            <Link2 className="text-purple-500" size={20} />
          </div>
          <div className="text-3xl font-bold text-purple-900">{totalBridgePapers}</div>
          <div className="text-xs text-purple-600 mt-1">{bridgePaperPercentage}% cite multiple models</div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-amber-700">Total Connections</span>
            <TrendingUp className="text-amber-500" size={20} />
          </div>
          <div className="text-3xl font-bold text-amber-900">{totalConnections}</div>
          <div className="text-xs text-amber-600 mt-1">Cross-model paper connections</div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <Award className="text-yellow-500 mr-2" size={20} />
          Key Findings
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Most Connected Model */}
          {mostConnectedModel && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-sm font-medium text-blue-700 mb-2">Most Connected Model</div>
              <div className="text-lg font-bold text-blue-900 mb-1">{mostConnectedModel.name}</div>
              <div className="text-sm text-blue-700">
                {mostConnectedModel.totalConnections} connections across {mostConnectedModel.connectedModelsCount} models
              </div>
              <div className="text-xs text-blue-600 mt-2">
                {mostConnectedModel.totalPapers} total papers
              </div>
            </div>
          )}

          {/* Strongest Connection */}
          {strongestConnection && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="text-sm font-medium text-green-700 mb-2">Strongest Connection</div>
              <div className="text-lg font-bold text-green-900 mb-1">
                {strongestConnection.source} ↔ {strongestConnection.target}
              </div>
              <div className="text-sm text-green-700">
                {strongestConnection.strength} shared papers
              </div>
              <div className="text-xs text-green-600 mt-2">
                Most interconnected model pair
              </div>
            </div>
          )}

          {/* Top Bridge Paper */}
          {topBridgePaper && (
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="text-sm font-medium text-purple-700 mb-2">Top Bridge Paper</div>
              <div className="text-sm font-bold text-purple-900 mb-1 line-clamp-2">
                {topBridgePaper.title}
              </div>
              <div className="text-sm text-purple-700">
                Cites {topBridgePaper.modelCount} models
              </div>
              <div className="text-xs text-purple-600 mt-2">
                {topBridgePaper.citationCount} citations - {topBridgePaper.year}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Model Centrality Rankings */}
      {networkMetrics && networkMetrics.rankedModels && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Users className="text-indigo-500 mr-2" size={20} />
            Model Connectivity Rankings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {networkMetrics.rankedModels.slice(0, 8).map((model, index) => {
              const modelConfig = getModelConfig(model.name);
              const modelColor = modelConfig?.color || '#6B7280';

              return (
                <div
                  key={model.name}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white"
                      style={{ backgroundColor: modelColor }}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{model.name}</div>
                      <div className="text-xs text-gray-600">
                        {model.connectedModelsCount} models • {model.totalPapers.toLocaleString()} papers
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className="text-lg font-bold"
                      style={{ color: modelColor }}
                    >
                      {model.totalConnections}
                    </div>
                    <div className="text-xs text-gray-500">connections</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkInsightsCard;

// Generic Dashboard component that works with any model
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Award, TrendingUp, GitBranch, Droplet, ArrowRight, Download, RefreshCw, ExternalLink } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import { calculateMetrics, processCitationTrends } from '../utils/dataUtils';
import { getModelConfig } from '../config/modelConfig';

// Import chart components
import CitationTrendsChart from '../components/charts/CitationTrendsChart';
import EngagementLevelsCard from '../components/charts/EngagementLevelsCard';
import FutureTrendsChart from '../components/charts/FutureTrendsChart';
import GitHubMetricsCard from '../components/charts/GitHubMetricsCard';

const GenericDashboard = ({ modelName, citationsData }) => {
  const [refreshing, setRefreshing] = useState(false);
  const modelConfig = getModelConfig(modelName);

  // Calculate metrics from the JSON data
  const metrics = useMemo(() => {
    if (!citationsData || citationsData.length === 0) {
      return {
        totalPapers: 0,
        totalCitations: 0,
        avgCitations: 0,
        growthRate: 0
      };
    }

    return calculateMetrics(citationsData);
  }, [citationsData]);

  // Process citation trends
  const citationTrends = useMemo(() => {
    if (!citationsData || citationsData.length === 0) return [];
    return processCitationTrends(citationsData);
  }, [citationsData]);

  const handleRefresh = () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 1000);
  };

  if (!modelConfig) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">Model Not Found</h1>
            <p className="text-gray-600 mt-2">The model "{modelName}" is not configured.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: modelConfig.color }}
                >
                  {modelConfig.name.charAt(0)}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{modelConfig.displayName} Dashboard</h1>
                  <p className="text-sm text-gray-600">{modelConfig.description}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Papers"
            value={metrics.totalPapers.toLocaleString()}
            icon={<Award className="w-6 h-6" />}
            iconBg="bg-blue-500"
            trend={null}
            trendUp={true}
            breakdown={[]}
          />
          <MetricCard
            title="Total Citations"
            value={metrics.totalCitations.toLocaleString()}
            icon={<TrendingUp className="w-6 h-6" />}
            iconBg="bg-green-500"
            trend={null}
            trendUp={true}
            breakdown={[]}
          />
          <MetricCard
            title="Average Citations"
            value={metrics.avgCitations.toString()}
            icon={<GitBranch className="w-6 h-6" />}
            iconBg="bg-purple-500"
            trend={null}
            trendUp={true}
            breakdown={[]}
          />
          <MetricCard
            title="Growth Rate"
            value={`${metrics.growthRate}%`}
            icon={<Droplet className="w-6 h-6" />}
            iconBg="bg-orange-500"
            trend={`${Math.abs(metrics.growthRate)}% ${metrics.growthRate >= 0 ? 'increase' : 'decrease'}`}
            trendUp={metrics.growthRate >= 0}
            breakdown={[]}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Citation Trends Chart */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Citation Trends</h3>
              <p className="text-sm text-gray-600">Publications and citations over time</p>
            </div>
            <div className="p-6">
              <CitationTrendsChart data={citationsData} />
            </div>
          </div>

          {/* Engagement Levels */}
          <EngagementLevelsCard data={citationsData} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Future Trends */}
          <FutureTrendsChart data={citationsData} />
          
          {/* GitHub Metrics */}
          {modelConfig.github ? (
            <GitHubMetricsCard 
              owner={modelConfig.github.split('/')[3]} 
              repo={modelConfig.github.split('/')[4]} 
            />
          ) : (
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">GitHub Repository</h3>
                <p className="text-gray-500 text-sm">No dedicated GitHub repository available</p>
                <p className="text-gray-400 text-xs mt-2">
                  Visit the project website for more information
                </p>
                {modelConfig.website && (
                  <a 
                    href={modelConfig.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center mt-3 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Visit Website
                    <ExternalLink className="ml-1 w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Navigation */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Explore {modelConfig.displayName} Data</h3>
            <p className="text-sm text-gray-600">Dive deeper into specific aspects of {modelConfig.displayName} research</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                to={`/science-model-dashboard/${modelName}/citations`}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div>
                  <h4 className="font-medium text-gray-900">Citations Analysis</h4>
                  <p className="text-sm text-gray-600">Detailed citation patterns and trends</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </Link>
              
              <Link
                to={`/science-model-dashboard/${modelName}/geographic-impact`}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div>
                  <h4 className="font-medium text-gray-900">Geographic Impact</h4>
                  <p className="text-sm text-gray-600">Global distribution and regional analysis</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </Link>
              
              <Link
                to={`/science-model-dashboard/${modelName}/research-domains`}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div>
                  <h4 className="font-medium text-gray-900">Research Domains</h4>
                  <p className="text-sm text-gray-600">Scientific fields and applications</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenericDashboard;
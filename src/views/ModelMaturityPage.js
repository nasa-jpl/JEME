// Cross-Model Maturity & Capability Level (MCL) Dashboard
// Compares all 8 JEME models across 14 Tier 1 dimensions and 5 Tier 2 domains

import React, { useState, useMemo } from 'react';
import { Shield, Filter } from 'lucide-react';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import MaturityRadarChart from '../components/model-maturity/MaturityRadarChart';
import MaturityHeatmap from '../components/model-maturity/MaturityHeatmap';
import ModelMaturityCard from '../components/model-maturity/ModelMaturityCard';
import DimensionBarChart from '../components/model-maturity/DimensionBarChart';
import Tier2DomainPanel from '../components/model-maturity/Tier2DomainPanel';
import { TIER1_DIMENSIONS, calculateTier1Average, getReadiness } from '../config/mclConfig';
import { getModelConfig } from '../config/modelConfig';
import mclScores from '../data/mcl_scores.json';

const ModelMaturityPage = () => {
  const [selectedDimension, setSelectedDimension] = useState(null);
  const [selectedModels, setSelectedModels] = useState(null); // null = all

  const models = Object.keys(mclScores);

  // Summary statistics
  const summaryStats = useMemo(() => {
    const avgs = models.map(m => ({
      model: m,
      avg: calculateTier1Average(mclScores[m]?.tier1),
    }));
    avgs.sort((a, b) => b.avg - a.avg);

    const overallAvg = avgs.reduce((sum, a) => sum + a.avg, 0) / avgs.length;
    const highestModel = avgs[0];
    const lowestModel = avgs[avgs.length - 1];

    // Find most common gaps (dimensions where most models score < 2)
    const dimGapCounts = TIER1_DIMENSIONS.map(dim => ({
      dim,
      gapCount: models.filter(m => (mclScores[m]?.tier1?.[dim.id]?.score ?? 0) < 2).length,
    })).sort((a, b) => b.gapCount - a.gapCount);

    return { avgs, overallAvg, highestModel, lowestModel, dimGapCounts };
  }, [models]);

  const toggleModel = (model) => {
    if (!selectedModels) {
      setSelectedModels([model]);
    } else if (selectedModels.includes(model)) {
      const next = selectedModels.filter(m => m !== model);
      setSelectedModels(next.length === 0 ? null : next);
    } else {
      setSelectedModels([...selectedModels, model]);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <NavBar activeItem="Model Maturity" />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Shield size={32} className="text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">Model Maturity & Capability Levels</h1>
          </div>
          <p className="text-gray-600 max-w-3xl">
            Systematic assessment of all JEME models using JPL's MCL framework — 14 Tier 1 core dimensions
            and 5 Tier 2 application domains, each scored 0-3 with evidence-based justification.
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border-t-4 border-indigo-500">
            <p className="text-2xl font-bold text-gray-900">{models.length}</p>
            <p className="text-sm text-gray-600">Models Assessed</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-t-4 border-blue-500">
            <p className="text-2xl font-bold text-gray-900">{summaryStats.overallAvg.toFixed(1)}</p>
            <p className="text-sm text-gray-600">Mean Tier 1 Score</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-t-4 border-green-500">
            <p className="text-2xl font-bold text-gray-900">{summaryStats.highestModel.model}</p>
            <p className="text-sm text-gray-600">Highest ({summaryStats.highestModel.avg.toFixed(1)})</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-t-4 border-amber-500">
            <p className="text-2xl font-bold text-gray-900">{summaryStats.dimGapCounts[0]?.dim.shortLabel}</p>
            <p className="text-sm text-gray-600">Most Common Gap ({summaryStats.dimGapCounts[0]?.gapCount}/{models.length} models)</p>
          </div>
        </div>

        {/* Model Filter */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={16} className="text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">Filter Models</span>
            {selectedModels && (
              <button
                onClick={() => setSelectedModels(null)}
                className="text-xs text-blue-600 hover:underline ml-2"
              >
                Show All
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {models.map(model => {
              const config = getModelConfig(model);
              const isSelected = !selectedModels || selectedModels.includes(model);
              const avg = calculateTier1Average(mclScores[model]?.tier1);
              const readiness = getReadiness(avg);
              return (
                <button
                  key={model}
                  onClick={() => toggleModel(model)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition-all ${
                    isSelected
                      ? 'border-gray-300 bg-white shadow-sm'
                      : 'border-gray-200 bg-gray-50 opacity-50'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: config?.color }} />
                  <span className="font-medium">{model}</span>
                  <span className="text-xs px-1 py-0.5 rounded" style={{ backgroundColor: readiness.color + '20', color: readiness.color }}>
                    {avg.toFixed(1)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Model Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {(selectedModels || models).map(model => (
            <ModelMaturityCard
              key={model}
              modelName={model}
              modelData={mclScores[model]}
            />
          ))}
        </div>

        {/* Radar Chart */}
        <div className="mb-6">
          <MaturityRadarChart mclData={mclScores} selectedModels={selectedModels} />
        </div>

        {/* Heatmap */}
        <div className="mb-6">
          <MaturityHeatmap mclData={selectedModels ? Object.fromEntries(selectedModels.map(m => [m, mclScores[m]])) : mclScores} />
        </div>

        {/* Dimension Bar Charts */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-1">Dimension Comparison</h3>
          <p className="text-sm text-gray-600 mb-4">Select a dimension to see cross-model comparison</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {TIER1_DIMENSIONS.map(dim => (
              <button
                key={dim.id}
                onClick={() => setSelectedDimension(selectedDimension === dim.id ? null : dim.id)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  selectedDimension === dim.id
                    ? 'bg-indigo-100 border-indigo-300 text-indigo-700 font-medium'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {dim.shortLabel}
              </button>
            ))}
          </div>
          {selectedDimension && (
            <DimensionBarChart
              mclData={selectedModels ? Object.fromEntries(selectedModels.map(m => [m, mclScores[m]])) : mclScores}
              dimensionId={selectedDimension}
            />
          )}
          {!selectedDimension && (
            <p className="text-sm text-gray-400 text-center py-8">Select a dimension above to view the bar chart comparison</p>
          )}
        </div>

        {/* Tier 2 Domain Panels */}
        <div className="mb-6">
          <Tier2DomainPanel mclData={selectedModels ? Object.fromEntries(selectedModels.map(m => [m, mclScores[m]])) : mclScores} />
        </div>

        {/* Methodology note */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-bold text-indigo-900 mb-1">Assessment Methodology</h3>
          <p className="text-xs text-indigo-700">
            Scores follow JPL's Model Capability Level (MCL) framework, adapted from DOE's PCMM and NASA's TRL systems.
            Each dimension uses a 0-3 scale: 0 (None), 1 (Low), 2 (Medium), 3 (High). Assessments are based on
            peer-reviewed publications, model documentation, intercomparison results, and operational usage evidence.
            Tier 1 captures 14 core model capabilities; Tier 2 evaluates fitness for 5 application domains.
          </p>
        </div>

        <Footer />
      </main>
    </div>
  );
};

export default ModelMaturityPage;

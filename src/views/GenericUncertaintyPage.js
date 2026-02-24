// src/views/GenericUncertaintyPage.js
// Dedicated uncertainty deep-dive page for any model

import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, ShieldCheck, AlertTriangle, BarChart3 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { getModelConfig } from '../config/modelConfig';
import { calculateUncertaintyMetrics, getConfidenceColor, getConfidenceLabel } from '../utils/uncertaintyUtils';
import UncertaintyOverviewCard from '../components/charts/UncertaintyOverviewCard';
import UncertaintyMatrixCard from '../components/charts/UncertaintyMatrixCard';
import ConfidenceByClassificationChart from '../components/charts/ConfidenceByClassificationChart';
import EvidenceGapsCard from '../components/charts/EvidenceGapsCard';

const GenericUncertaintyPage = () => {
  const { modelName } = useParams();
  const modelConfig = getModelConfig(modelName);

  const [citationsData, setCitationsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      if (!modelConfig) {
        setError(`Model "${modelName}" not found`);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const { loadModelData } = await import('../utils/dataLoader');
        const data = await loadModelData(modelName);
        setCitationsData(data);
        setError(null);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(`Error loading data for ${modelConfig.displayName}: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [modelName, modelConfig]);

  const metrics = useMemo(() => calculateUncertaintyMetrics(citationsData), [citationsData]);

  const hasUncertainty = metrics !== null;

  // Pipeline variance distribution
  const pipelineVarDist = useMemo(() => {
    if (!citationsData || !Array.isArray(citationsData)) return [];
    const buckets = { '0.0': 0, '0.5': 0, '1.0': 0 };
    citationsData.forEach(entry => {
      if (!entry.uncertainty) return;
      const pv = entry.uncertainty.error_estimates?.pipeline_variance;
      if (pv === 0) buckets['0.0']++;
      else if (pv === 0.5) buckets['0.5']++;
      else if (pv === 1.0) buckets['1.0']++;
    });
    return [
      { label: 'No disagreement (0.0)', value: buckets['0.0'], color: '#22C55E' },
      { label: 'Partial (0.5)', value: buckets['0.5'], color: '#F59E0B' },
      { label: 'Full disagreement (1.0)', value: buckets['1.0'], color: '#EF4444' },
    ];
  }, [citationsData]);

  if (!modelConfig) {
    return (
      <div className="bg-gray-100 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center">
          <h1 className="text-2xl font-bold text-red-600">Model Not Found</h1>
          <p className="text-gray-600 mt-2">The model "{modelName}" is not configured.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center">
            <Link
              to={`/science-model-dashboard/${modelName}`}
              className="flex items-center text-blue-600 hover:text-blue-800 mr-6"
            >
              <ArrowLeft size={18} className="mr-1" />
              <span className="font-medium">Back to {modelConfig.displayName} Dashboard</span>
            </Link>
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} className="text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">
                {modelConfig.displayName} Uncertainty Analysis
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4 mb-6">
            <p className="font-medium">Notice</p>
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-6 flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
              <p className="text-gray-600">Loading uncertainty data...</p>
            </div>
          </div>
        ) : !hasUncertainty ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <AlertTriangle size={48} className="text-amber-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-800 mb-2">No Uncertainty Data Available</h2>
            <p className="text-gray-600">
              Run <code className="bg-gray-100 px-2 py-0.5 rounded text-sm">python scripts/compute_uncertainty.py --model {modelName}</code> to generate uncertainty scores.
            </p>
          </div>
        ) : (
          <>
            {/* Summary metrics row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm p-5">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck size={18} className="text-blue-600" />
                  <span className="text-sm font-medium text-gray-600">Composite Confidence</span>
                </div>
                <div className="text-3xl font-bold" style={{ color: getConfidenceColor(metrics.avgComposite) }}>
                  {Math.round(metrics.avgComposite * 100)}%
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {getConfidenceLabel(metrics.avgComposite)} across {metrics.totalWithUncertainty.toLocaleString()} entries
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-5">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 size={18} className="text-green-600" />
                  <span className="text-sm font-medium text-gray-600">Evidence Coverage</span>
                </div>
                <div className="text-3xl font-bold text-green-600">
                  {Math.round(metrics.avgEvidence * 100)}%
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {metrics.abstractCount.toLocaleString()} of {metrics.totalWithUncertainty.toLocaleString()} have abstracts
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-5">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={18} className="text-amber-500" />
                  <span className="text-sm font-medium text-gray-600">Flagged Entries</span>
                </div>
                <div className="text-3xl font-bold text-amber-600">
                  {(metrics.lowCount + metrics.veryLowCount).toLocaleString()}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Low/very low confidence ({Math.round(((metrics.lowCount + metrics.veryLowCount) / metrics.totalWithUncertainty) * 100)}%)
                </div>
              </div>
            </div>

            {/* Uncertainty matrix + overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <UncertaintyMatrixCard data={citationsData} />
              <UncertaintyOverviewCard data={citationsData} />
            </div>

            {/* Confidence by engagement */}
            <div className="mb-6">
              <ConfidenceByClassificationChart data={citationsData} />
            </div>

            {/* Evidence gaps */}
            <div className="mb-6">
              <EvidenceGapsCard data={citationsData} />
            </div>

            {/* Error source breakdown */}
            <div className="bg-white rounded-lg p-5 shadow-sm mb-6">
              <div className="text-base font-semibold text-gray-800 mb-4">Error Source Breakdown</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Pipeline variance */}
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-3">Pipeline Variance</div>
                  <div className="text-xs text-gray-500 mb-2">
                    Keyword classifier vs LLM label agreement
                  </div>
                  <div className="space-y-2">
                    {pipelineVarDist.map((item, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600">{item.label}</span>
                          <span className="font-medium">{item.value.toLocaleString()}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${metrics.totalWithUncertainty > 0 ? (item.value / metrics.totalWithUncertainty * 100) : 0}%`,
                              backgroundColor: item.color
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Miscalibration risk */}
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-3">Miscalibration Risk</div>
                  <div className="text-xs text-gray-500 mb-2">
                    Risk of systematic classification errors
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: 'Low risk', value: metrics.miscalibrationDistribution.low, color: '#22C55E' },
                      { label: 'Medium risk', value: metrics.miscalibrationDistribution.medium, color: '#F59E0B' },
                      { label: 'High risk', value: metrics.miscalibrationDistribution.high, color: '#EF4444' },
                    ].map((item, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600">{item.label}</span>
                          <span className="font-medium">{item.value.toLocaleString()}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${metrics.totalWithUncertainty > 0 ? (item.value / metrics.totalWithUncertainty * 100) : 0}%`,
                              backgroundColor: item.color
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Abstract coverage detail */}
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-3">Abstract Coverage</div>
                  <div className="text-xs text-gray-500 mb-2">
                    Entries with full text for classification
                  </div>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex-1">
                      <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${metrics.abstractCoverage * 100}%`,
                            backgroundColor: '#3B82F6'
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {Math.round(metrics.abstractCoverage * 100)}%
                    </span>
                  </div>
                  <div className="mt-3 text-xs text-gray-500">
                    {metrics.abstractCount.toLocaleString()} with abstract / {(metrics.totalWithUncertainty - metrics.abstractCount).toLocaleString()} without
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Entries without abstracts receive lower reasoning confidence (0.4 vs 0.7) and are more
                    likely to be flagged for miscalibration risk.
                  </div>
                </div>
              </div>
            </div>

            {/* Methodology note */}
            <div className="bg-blue-50 rounded-lg p-5 border border-blue-100">
              <div className="text-sm font-semibold text-blue-900 mb-2">About This Analysis</div>
              <div className="text-sm text-blue-800 space-y-2">
                <p>
                  <strong>Phase 1 (Current):</strong> Deterministic uncertainty estimation using metadata signals.
                  No LLM API calls required. Evidence confidence is computed from data completeness (abstract, DOI, venue, authors, keyword matches).
                  Reasoning confidence uses a heuristic default (0.7 with abstract, 0.4 without).
                  Pipeline variance measures disagreement between keyword classifiers and LLM labels.
                </p>
                <p>
                  <strong>Phase 2 (Future):</strong> LLM-enhanced confidence via multi-temperature sampling
                  and self-assessed reasoning scores. Stochastic variance will replace the current null placeholder.
                </p>
                <p>
                  <strong>Phase 3 (Future):</strong> Skeptic agent for adversarial review of high-impact/low-evidence
                  classifications, plus calibration against known-good/known-bad datasets.
                </p>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default GenericUncertaintyPage;

// Per-Model Maturity & Capability Detail Page
// Shows detailed MCL scores for a single model with evidence and gap analysis

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Shield, ArrowLeft, ChevronRight } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import DimensionDetailCard from '../components/model-maturity/DimensionDetailCard';
import GapAnalysisPanel from '../components/model-maturity/GapAnalysisPanel';
import { TIER1_DIMENSIONS, TIER2_DOMAINS, SCORE_COLORS, calculateTier1Average, calculateTier2DomainAverage, getReadiness } from '../config/mclConfig';
import { getModelConfig } from '../config/modelConfig';
import mclScores from '../data/mcl_scores.json';

const GenericMaturityPage = () => {
  const { modelName } = useParams();
  const config = getModelConfig(modelName);
  const modelData = mclScores[modelName];

  if (!modelData) {
    return (
      <div className="bg-gray-100 min-h-screen">
        <NavBar activeItem={modelName} />
        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-white rounded-lg p-8 shadow-sm text-center">
            <Shield size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No maturity assessment data available for {modelName}.</p>
            <Link to="/science-model-dashboard/model-maturity" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
              Back to Model Maturity Dashboard
            </Link>
          </div>
          <Footer />
        </main>
      </div>
    );
  }

  const tier1Avg = calculateTier1Average(modelData.tier1);
  const readiness = getReadiness(tier1Avg);

  // Radar data for this model
  const radarData = TIER1_DIMENSIONS.map(dim => ({
    dimension: dim.shortLabel,
    fullName: dim.label,
    score: modelData.tier1?.[dim.id]?.score ?? 0,
  }));

  // Tier 2 summary
  const tier2Summary = TIER2_DOMAINS.map(domain => ({
    ...domain,
    avg: calculateTier2DomainAverage(modelData.tier2?.[domain.id]),
    subScores: domain.subDimensions.map(sub => ({
      ...sub,
      score: modelData.tier2?.[domain.id]?.[sub.id]?.score ?? 0,
      evidence: modelData.tier2?.[domain.id]?.[sub.id]?.evidence,
    })),
  }));

  // Score distribution
  const scoreDist = [0, 1, 2, 3].map(level => ({
    level,
    count: TIER1_DIMENSIONS.filter(dim => (modelData.tier1?.[dim.id]?.score ?? 0) === level).length,
  }));

  return (
    <div className="bg-gray-100 min-h-screen">
      <NavBar activeItem={modelName} />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link to="/science-model-dashboard/model-maturity" className="hover:text-blue-600 flex items-center gap-1">
            <ArrowLeft size={14} /> Model Maturity
          </Link>
          <ChevronRight size={14} />
          <span className="font-medium text-gray-700">{modelName}</span>
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: config?.color + '20' }}>
                <Shield size={24} style={{ color: config?.color }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{modelName} Maturity Assessment</h1>
                <p className="text-sm text-gray-600">{config?.fullDescription || config?.description}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold" style={{ color: config?.color }}>{tier1Avg.toFixed(1)}</div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: readiness.color + '20', color: readiness.color }}>
                {readiness.label}
              </span>
            </div>
          </div>

          {/* Score distribution mini */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
            <span className="text-xs text-gray-500">Score Distribution:</span>
            {scoreDist.map(({ level, count }) => (
              <div key={level} className="flex items-center gap-1">
                <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: SCORE_COLORS[level]?.bg, color: SCORE_COLORS[level]?.text }}>
                  {level}
                </span>
                <span className="text-xs text-gray-600">{count} dims</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Radar Chart */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Tier 1 Capability Profile</h3>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData} outerRadius="75%">
                <PolarGrid strokeDasharray="3 3" />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10, fill: '#4B5563' }} />
                <PolarRadiusAxis angle={90} domain={[0, 3]} tickCount={4} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2">
                        <p className="text-sm font-semibold">{d.fullName}</p>
                        <p className="text-xs">{d.score}/3</p>
                      </div>
                    );
                  }}
                />
                <Radar
                  dataKey="score"
                  stroke={config?.color || '#6B7280'}
                  fill={config?.color || '#6B7280'}
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Tier 2 Summary */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Tier 2 Domains</h3>
            <div className="space-y-4">
              {tier2Summary.map(domain => (
                <div key={domain.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{domain.shortLabel}</span>
                    <span className="text-sm font-bold" style={{ color: config?.color }}>{domain.avg.toFixed(1)}</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-3 mb-1">
                    <div
                      className="h-3 rounded-full transition-all"
                      style={{
                        width: `${(domain.avg / 3) * 100}%`,
                        backgroundColor: config?.color,
                        opacity: 0.7,
                      }}
                    />
                  </div>
                  <div className="flex gap-1">
                    {domain.subScores.map(sub => (
                      <span
                        key={sub.id}
                        className="text-[10px] px-1 py-0.5 rounded"
                        style={{ backgroundColor: SCORE_COLORS[sub.score]?.bg, color: SCORE_COLORS[sub.score]?.text }}
                        title={`${sub.label}: ${sub.score}/3`}
                      >
                        {sub.score}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gap Analysis */}
        <div className="mb-6">
          <GapAnalysisPanel modelData={modelData} modelColor={config?.color} />
        </div>

        {/* Tier 1 Dimension Details */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-1">Tier 1 Dimension Breakdown</h3>
          <p className="text-sm text-gray-600 mb-4">Click each dimension to see criteria, evidence, and level descriptions</p>
          <div className="space-y-2">
            {TIER1_DIMENSIONS.map(dim => (
              <DimensionDetailCard
                key={dim.id}
                dimension={dim}
                scoreData={modelData.tier1?.[dim.id]}
                modelColor={config?.color}
              />
            ))}
          </div>
        </div>

        {/* Tier 2 Detailed Breakdown */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-1">Tier 2 Domain Details</h3>
          <p className="text-sm text-gray-600 mb-4">Evidence for each application domain sub-dimension</p>
          <div className="space-y-4">
            {tier2Summary.map(domain => (
              <div key={domain.id} className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-bold text-gray-900 mb-3">
                  {domain.label}
                  <span className="ml-2 text-xs font-normal text-gray-500">{domain.description}</span>
                </h4>
                <div className="space-y-2">
                  {domain.subScores.map(sub => {
                    const sc = SCORE_COLORS[sub.score] || SCORE_COLORS[0];
                    return (
                      <div key={sub.id} className="flex items-start gap-3 p-2 bg-gray-50 rounded">
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: sc.bg, color: sc.text }}
                        >
                          {sub.score}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{sub.label}</p>
                          {sub.evidence && (
                            <p className="text-xs text-gray-600 mt-0.5">{sub.evidence}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Footer />
      </main>
    </div>
  );
};

export default GenericMaturityPage;

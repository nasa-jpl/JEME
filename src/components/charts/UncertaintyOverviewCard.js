// src/components/charts/UncertaintyOverviewCard.js
// Summary card: avg composite confidence, distribution histogram

import React, { useMemo } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ShieldCheck } from 'lucide-react';
import { calculateUncertaintyMetrics, bucketConfidenceScores, getConfidenceColor, getConfidenceLabel } from '../../utils/uncertaintyUtils';

const UncertaintyOverviewCard = ({ data }) => {
  const metrics = useMemo(() => calculateUncertaintyMetrics(data), [data]);
  const buckets = useMemo(() => bucketConfidenceScores(data), [data]);

  if (!metrics) return null;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{d.label} ({d.range})</p>
          <p className="text-sm text-gray-600">{d.count} entries</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm h-full">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck size={20} className="text-blue-600" />
        <div>
          <div className="text-base font-semibold text-gray-800">Classification Confidence</div>
          <div className="text-sm text-gray-500">
            How reliable are the automated classifications
          </div>
        </div>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold" style={{ color: getConfidenceColor(metrics.avgComposite) }}>
            {Math.round(metrics.avgComposite * 100)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">Avg Confidence</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-600">
            {Math.round((metrics.highCount / metrics.totalWithUncertainty) * 100)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">High Confidence</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-500">
            {metrics.lowCount + metrics.veryLowCount}
          </div>
          <div className="text-xs text-gray-500 mt-1">Low Confidence</div>
        </div>
      </div>

      {/* Histogram */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={buckets} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="range" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {buckets.map((bucket, idx) => (
                <Cell key={idx} fill={bucket.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Evidence quality */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Abstract Coverage</span>
          <span className="font-medium">{Math.round(metrics.abstractCoverage * 100)}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${metrics.abstractCoverage * 100}%`,
              backgroundColor: getConfidenceColor(metrics.abstractCoverage)
            }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <span>Miscalibration: {metrics.miscalibrationDistribution.high} high risk</span>
          <span>
            Overall: {getConfidenceLabel(metrics.avgComposite)}
          </span>
        </div>
      </div>

      {/* Methodology explanation */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="text-xs font-semibold text-gray-700 mb-2">How Confidence Is Calculated</div>
        <div className="text-xs text-gray-500 space-y-1.5">
          <p>
            Each paper's <span className="font-medium text-gray-700">composite confidence</span> combines
            two independent signals plus a disagreement penalty:
          </p>
          <div className="pl-2 space-y-1">
            <p>
              <span className="font-medium text-gray-700">Evidence confidence (40%)</span> — weighted sum of
              data completeness: has abstract (35%), has DOI (15%), has venue (15%),
              has full authors (10%), and domain keyword match score (25%).
            </p>
            <p>
              <span className="font-medium text-gray-700">Reasoning confidence (40%)</span> — heuristic
              proxy for LLM classification reliability. Currently 0.7 when an abstract is available
              (richer context), 0.4 without (title-only).
            </p>
            <p>
              <span className="font-medium text-gray-700">Pipeline variance penalty (20%)</span> — measures
              disagreement between the keyword-based classifier and the LLM (Gemini) labels. Domain mismatch
              adds 0.5, engagement mismatch adds 0.5.
            </p>
          </div>
          <p className="pt-1">
            Formula: <code className="bg-gray-100 px-1 rounded text-gray-600">0.4 &times; evidence + 0.4 &times; reasoning &minus; 0.2 &times; variance</code>, clamped to [5%, 99%].
          </p>
        </div>
      </div>
    </div>
  );
};

export default UncertaintyOverviewCard;

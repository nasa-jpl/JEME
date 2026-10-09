// src/components/MethodologySummary.js
// Short "what am I looking at" paragraph shown above the charts.
//
// Exists because the counts on this dashboard are CITATIONS (papers that cite a
// team paper), not publications by the JPL team. Reading "980" as "the RAPID
// team published 980 papers" is the single most likely misinterpretation, so
// the framing is stated up front on every page.

import React from 'react';
import { Link } from 'react-router-dom';
import { Info } from 'lucide-react';

const MethodologySummary = ({ modelName }) => {
  const teamLabel = modelName ? `the ${modelName} team` : 'the JPL modeling team';
  const modelLabel = modelName || 'a model';

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm mb-6">
      <div className="flex items-start gap-3">
        <Info size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-gray-700 leading-relaxed">
          <div className="text-base font-semibold text-gray-800 mb-2">What counts as a citation</div>
          <p>
            Each number is the count of{' '}
            <span className="font-semibold text-gray-900">citations</span>: peer-reviewed papers
            that reference {modelLabel}'s team papers. Citations are a reflection of the degree the
            broader community has referenced, utilized, and/or built on that model.
          </p>
          <div className="mt-3 pl-3 border-l-2 border-gray-200 text-gray-600 space-y-2">
            <p>
              <span className="font-medium text-gray-900">Team papers</span> are the peer-reviewed
              publications {teamLabel} wrote to describe the model itself: its scientific
              foundation, evolution, and upgrades over time.
            </p>
            <p>
              <span className="font-medium text-gray-900">Citations</span> are peer-reviewed papers
              by other researchers (or later team papers) that reference one or more of those team
              papers.
            </p>
          </div>
          <p className="mt-3">
            This measures how widely {modelLabel} has been taken up by the broader research
            community, not how many papers the team itself has published.
          </p>

          <div className="text-base font-semibold text-gray-800 mt-4 mb-2">
            Citation depth: L1 / L2 / L3
          </div>
          <p>Every citing paper is classified by how deeply it engages with the model:</p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>
              <span className="font-medium text-gray-900">L1 (Citation only):</span> references the
              model as background or context
            </li>
            <li>
              <span className="font-medium text-gray-900">L2 (Data usage):</span> uses the model's
              outputs or datasets
            </li>
            <li>
              <span className="font-medium text-gray-900">L3 (Model adaptation):</span> runs,
              modifies, extends, or couples the model
            </li>
          </ul>
          <p className="mt-2">
            Classification is automated; each paper includes a confidence score so lower-confidence
            assignments can be flagged for review.
          </p>

          <p className="mt-3 text-gray-600">
            See{' '}
            <Link to="/how-it-works" className="text-blue-600 hover:text-blue-800 font-medium">
              How It Works
            </Link>{' '}
            for the architecture overview, data sources, and uncertainty methodology.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MethodologySummary;

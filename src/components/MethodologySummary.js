// src/components/MethodologySummary.js
// Short "what am I looking at" paragraph shown above the charts.
//
// Exists because the counts on this dashboard are CITATIONS (papers that cite a
// team paper), not publications by the JPL team. Reading "1,203" as "the RAPID
// team published 1,203 papers" is the single most likely misinterpretation, so
// the framing is stated up front on every page.
//
// The corpus also contains a small share (2-5% across models) of the team's own
// later papers citing their earlier ones, so when a model is named we load the
// team-paper list and report that count rather than implying every citation is
// external.

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Info } from 'lucide-react';
import { loadTeamPapers, countTeamPaperCitations } from '../utils/teamPapers';

const MethodologySummary = ({ modelName, citationsData }) => {
  // { inCorpus, listSize }: how many of the team's own papers show up as
  // citations, out of how many team papers there are in total. Both numbers are
  // needed, or "37 team papers" reads as "the team has 37 papers".
  const [teamStats, setTeamStats] = useState(null);

  const total = citationsData?.length || 0;

  useEffect(() => {
    let cancelled = false;
    if (!modelName || total === 0) {
      setTeamStats(null);
      return undefined;
    }
    loadTeamPapers(modelName).then((teamPapers) => {
      if (cancelled) return;
      const inCorpus = countTeamPaperCitations(citationsData, teamPapers);
      setTeamStats(inCorpus > 0 ? { inCorpus, listSize: teamPapers.length } : null);
    });
    return () => {
      cancelled = true;
    };
  }, [modelName, citationsData, total]);

  const totalLabel = total > 0 ? total.toLocaleString() : null;
  const externalLabel = teamStats ? (total - teamStats.inCorpus).toLocaleString() : null;
  const teamPct =
    teamStats && total > 0 ? Math.max(1, Math.round((teamStats.inCorpus / total) * 100)) : null;

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm mb-6">
      <div className="flex items-start gap-3">
        <Info size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-gray-700 leading-relaxed">
          <div className="text-base font-semibold text-gray-800 mb-2">
            How to read this dashboard
          </div>
          <p>
            Every number here starts from a set of{' '}
            <span className="font-semibold text-gray-900">team papers</span>: the peer-reviewed
            publications {modelName ? `the ${modelName} team` : 'each JPL modeling team'} wrote to
            describe the model itself. We then collect every peer-reviewed paper that cites one of
            those team papers, and it is those{' '}
            <span className="font-semibold text-gray-900">citations</span> that this dashboard
            counts and charts.{' '}
            {totalLabel ? (
              <>
                So {totalLabel} means {totalLabel} papers cite a {modelName} team paper. It is{' '}
                <span className="font-semibold text-gray-900">not</span> {totalLabel} papers written
                by the {modelName} team.
              </>
            ) : (
              <>
                So a model's count is the number of papers that cite that model's team papers. It
                is <span className="font-semibold text-gray-900">not</span> a count of papers
                written by the team.
              </>
            )}
          </p>
          <p className="mt-2">
            {teamStats ? (
              <>
                The count is not purely external. The {modelName} team paper list holds{' '}
                <span className="font-medium text-gray-900">
                  {teamStats.listSize.toLocaleString()} papers
                </span>
                , and{' '}
                <span className="font-medium text-gray-900">
                  {teamStats.inCorpus.toLocaleString()} of those
                </span>{' '}
                also appear here as citations (about {teamPct}% of the {totalLabel}), because a
                later team paper cited an earlier one. The other {externalLabel} citations come from
                outside the team.
              </>
            ) : (
              <>
                The count is not purely external: a small share (a few percent) are team papers
                themselves, where a later team paper cites an earlier one. The rest come from
                outside the team.
              </>
            )}
          </p>
          <p className="mt-2">
            Each citation is then classified by how deeply it engages with the model:{' '}
            <span className="font-medium text-gray-900">L1: Citation only</span> (cites the work as
            background), <span className="font-medium text-gray-900">L2: Data Usage</span> (uses
            model outputs or datasets), or{' '}
            <span className="font-medium text-gray-900">L3: Model Adaptation</span> (runs, modifies,
            extends, or couples the model). Classification is automated, and every paper
            carries a confidence score so low-confidence calls can be reviewed first.
          </p>
          <p className="mt-2 text-gray-600">
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

// Earth System Section for individual model dashboards
// Shows how a model's papers distribute across Earth's five spheres
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Globe, Cloud, Droplets, Snowflake, TreePine, Mountain, HelpCircle,
         ArrowRight, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { classifyAllPapers } from '../utils/earthSystemClassifier';

const SPHERE_ICONS = {
  Atmosphere: Cloud,
  Hydrosphere: Droplets,
  Cryosphere: Snowflake,
  Biosphere: TreePine,
  Geosphere: Mountain,
  Unclassified: HelpCircle,
};

const EarthSystemSection = ({ modelName, citationsData }) => {
  const [selectedSphere, setSelectedSphere] = useState(null);
  const [showAllPapers, setShowAllPapers] = useState(false);

  const analysis = useMemo(() => {
    if (!citationsData || citationsData.length === 0) return null;
    return classifyAllPapers({ [modelName]: citationsData });
  }, [modelName, citationsData]);

  if (!analysis) return null;

  const { sphereData } = analysis;

  // Get spheres that have papers for this model, sorted by count
  const modelSpheres = Object.entries(sphereData)
    .filter(([name]) => name !== 'Unclassified')
    .map(([name, data]) => ({
      name,
      ...data,
      modelPaperCount: data.models[modelName] || 0,
    }))
    .filter(s => s.modelPaperCount > 0)
    .sort((a, b) => b.modelPaperCount - a.modelPaperCount);

  const totalClassified = modelSpheres.reduce((sum, s) => sum + s.modelPaperCount, 0);
  const unclassifiedCount = sphereData['Unclassified']?.models[modelName] || 0;
  const totalPapers = totalClassified + unclassifiedCount;

  // Primary sphere = the one with the most papers
  const primarySphere = modelSpheres[0];

  const selectedData = selectedSphere ? sphereData[selectedSphere] : null;
  const selectedPapers = selectedData
    ? [...selectedData.papers].sort((a, b) => (b.citation_count || 0) - (a.citation_count || 0)).slice(0, showAllPapers ? 15 : 5)
    : [];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Globe size={24} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Earth System Interconnections</h2>
            <p className="text-sm text-gray-600">
              How {modelName} research contributes to understanding Earth's interconnected spheres
            </p>
          </div>
        </div>
        <Link
          to="/science-model-dashboard/earth-system"
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          View All Models <ArrowRight size={14} />
        </Link>
      </div>

      {/* Sphere Distribution Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Paper Distribution Across Spheres</span>
          <span className="text-xs text-gray-500">{totalClassified.toLocaleString()} classified papers</span>
        </div>
        <div className="h-6 rounded-full overflow-hidden flex bg-gray-100">
          {modelSpheres.map(sphere => {
            const pct = (sphere.modelPaperCount / totalPapers) * 100;
            if (pct < 1) return null;
            return (
              <button
                key={sphere.name}
                onClick={() => setSelectedSphere(selectedSphere === sphere.name ? null : sphere.name)}
                className="h-full transition-opacity hover:opacity-80 relative group"
                style={{ width: `${pct}%`, backgroundColor: sphere.color }}
                title={`${sphere.name}: ${sphere.modelPaperCount} papers (${Math.round(pct)}%)`}
              >
                {pct > 8 && (
                  <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium">
                    {Math.round(pct)}%
                  </span>
                )}
              </button>
            );
          })}
          {unclassifiedCount > 0 && (unclassifiedCount / totalPapers) * 100 >= 1 && (
            <div
              className="h-full"
              style={{ width: `${(unclassifiedCount / totalPapers) * 100}%`, backgroundColor: '#9CA3AF' }}
              title={`Unclassified: ${unclassifiedCount} papers`}
            />
          )}
        </div>
      </div>

      {/* Sphere Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        {modelSpheres.map(sphere => {
          const Icon = SPHERE_ICONS[sphere.name];
          const pct = Math.round((sphere.modelPaperCount / totalPapers) * 100);
          const isSelected = selectedSphere === sphere.name;
          const isPrimary = sphere.name === primarySphere?.name;

          return (
            <button
              key={sphere.name}
              onClick={() => setSelectedSphere(isSelected ? null : sphere.name)}
              className={`text-left p-3 rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-blue-500 shadow-md bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-md" style={{ backgroundColor: `${sphere.color}20` }}>
                  <Icon size={16} style={{ color: sphere.color }} />
                </div>
                <span className="font-semibold text-sm text-gray-900">{sphere.name}</span>
                {isPrimary && (
                  <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                    Primary
                  </span>
                )}
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-lg font-bold text-gray-900">{sphere.modelPaperCount.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">papers ({pct}%)</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-700">{(sphere.totalCitations || 0).toLocaleString()}</p>
                  <p className="text-xs text-gray-500">citations</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Spheres with <1% */}
      {(() => {
        const minorSpheres = Object.entries(sphereData)
          .filter(([name]) => name !== 'Unclassified')
          .filter(([name, data]) => {
            const count = data.models[modelName] || 0;
            return count > 0 && (count / totalPapers) * 100 < 1;
          });
        if (minorSpheres.length === 0) return null;
        return (
          <p className="text-xs text-gray-400 mb-4">
            Also contributes to: {minorSpheres.map(([name]) => name).join(', ')} ({'<'}1% each)
          </p>
        );
      })()}

      {/* Selected Sphere Detail */}
      {selectedSphere && selectedData && (
        <div className="border-l-4 rounded-lg bg-gray-50 p-4 mb-4" style={{ borderColor: selectedData.color }}>
          <div className="flex items-center gap-2 mb-3">
            {(() => { const Icon = SPHERE_ICONS[selectedSphere]; return <Icon size={20} style={{ color: selectedData.color }} />; })()}
            <h3 className="font-bold text-gray-900">{selectedSphere}</h3>
            <span className="text-sm text-gray-500">- {selectedData.description}</span>
          </div>

          {/* Research domains in this sphere */}
          {selectedData.domains.length > 0 && (
            <div className="mb-3">
              <h4 className="text-xs font-semibold text-gray-600 mb-1.5">Research Domains</h4>
              <div className="flex flex-wrap gap-1">
                {selectedData.domains.slice(0, 10).map(d => (
                  <span key={d} className="px-2 py-0.5 text-xs rounded-full bg-white border border-gray-200 text-gray-600">
                    {d}
                  </span>
                ))}
                {selectedData.domains.length > 10 && (
                  <span className="px-2 py-0.5 text-xs text-gray-400">
                    +{selectedData.domains.length - 10} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Top papers in this sphere */}
          {selectedPapers.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-600 mb-1.5">Top Cited Papers</h4>
              <div className="space-y-1.5">
                {selectedPapers.map((paper, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 bg-white rounded border border-gray-100">
                    <span className="text-xs text-gray-400 mt-0.5 w-4">{i + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 line-clamp-1">{paper.title}</p>
                      <div className="flex gap-3 mt-0.5 text-xs text-gray-500">
                        <span>{paper.year || 'N/A'}</span>
                        <span>{(paper.citation_count || 0).toLocaleString()} citations</span>
                        {paper.doi && (
                          <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noopener noreferrer"
                             className="text-blue-500 hover:underline flex items-center gap-0.5">
                            <ExternalLink size={10} /> DOI
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {selectedData.papers.length > 5 && (
                <button
                  onClick={() => setShowAllPapers(!showAllPapers)}
                  className="mt-2 text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  {showAllPapers ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Show more</>}
                </button>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default EarthSystemSection;

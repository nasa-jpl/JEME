// Earth System Interconnections Page
// Classifies all JEME model papers into Earth's five major spheres
// and visualizes inter-sphere relationships via network graphs

import React, { useState, useEffect, useMemo } from 'react';
import { Globe, Cloud, Droplets, Snowflake, TreePine, Mountain, HelpCircle,
         ChevronDown, ChevronUp, ExternalLink,
         Filter, BarChart3 } from 'lucide-react';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import EarthSystemGraph from '../components/earth-system/EarthSystemGraph';
import { classifyAllPapers, SPHERE_DEFINITIONS } from '../utils/earthSystemClassifier';
import { getModelConfig } from '../config/modelConfig';

const SPHERE_ICONS = {
  Atmosphere: Cloud,
  Hydrosphere: Droplets,
  Cryosphere: Snowflake,
  Biosphere: TreePine,
  Geosphere: Mountain,
  Unclassified: HelpCircle,
};

// ─── Sphere Overview Cards ───────────────────────────────────────────────────

const SphereOverviewCards = ({ sphereData, onSelectSphere, selectedSphere }) => {
  const spheres = Object.entries(sphereData).filter(([name]) => name !== 'Unclassified');
  const unclassified = sphereData['Unclassified'];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {spheres.map(([name, data]) => {
          const Icon = SPHERE_ICONS[name] || Globe;
          const isSelected = selectedSphere === name;
          const modelCount = Object.keys(data.models).length;
          return (
            <button
              key={name}
              onClick={() => onSelectSphere(isSelected ? null : name)}
              className={`text-left p-4 rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-blue-500 shadow-lg bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${data.color}20` }}>
                  <Icon size={20} style={{ color: data.color }} />
                </div>
                <h3 className="font-bold text-gray-900">{name}</h3>
              </div>
              <p className="text-xs text-gray-500 mb-3 line-clamp-2">{data.description}</p>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Papers</span>
                  <span className="font-semibold">{(data.paperCount || data.papers?.length || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Citations</span>
                  <span className="font-semibold">{(data.totalCitations || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Models</span>
                  <span className="font-semibold">{modelCount}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {unclassified && (unclassified.paperCount || unclassified.papers.length) > 0 && (
        <div className="text-sm text-gray-500 text-center">
          {(unclassified.paperCount || unclassified.papers.length)} papers not classified into a sphere
        </div>
      )}
    </div>
  );
};

// ─── Sphere Detail Panel ─────────────────────────────────────────────────────

const SphereDetailPanel = ({ sphereName, data }) => {
  const [showAll, setShowAll] = useState(false);
  if (!data) return null;

  const Icon = SPHERE_ICONS[sphereName] || Globe;
  const sortedModels = Object.entries(data.models).sort((a, b) => b[1] - a[1]);
  const topPapers = [...data.papers]
    .sort((a, b) => (b.citation_count || 0) - (a.citation_count || 0))
    .slice(0, showAll ? 20 : 5);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border-l-4" style={{ borderColor: data.color }}>
      <div className="flex items-center gap-3 mb-4">
        <Icon size={24} style={{ color: data.color }} />
        <div>
          <h3 className="text-lg font-bold text-gray-900">{sphereName}</h3>
          <p className="text-sm text-gray-600">{data.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Model breakdown */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Contributing Models</h4>
          <div className="space-y-2">
            {sortedModels.map(([model, count]) => {
              const config = getModelConfig(model);
              const total = data.paperCount || data.papers.length || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={model} className="flex items-center gap-2">
                  <span className="text-sm font-medium w-24" style={{ color: config?.color }}>
                    {model}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-3">
                    <div
                      className="h-3 rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: config?.color || '#6B7280' }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-16 text-right">{count} ({pct}%)</span>
                </div>
              );
            })}
          </div>

          {/* Research domains */}
          <h4 className="text-sm font-semibold text-gray-700 mt-4 mb-2">Research Domains</h4>
          <div className="flex flex-wrap gap-1">
            {data.domains.slice(0, 12).map(d => (
              <span key={d} className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                {d}
              </span>
            ))}
          </div>
        </div>

        {/* Top papers */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Top Cited Papers</h4>
          <div className="space-y-2">
            {topPapers.map((paper, i) => (
              <div key={i} className="p-2 bg-gray-50 rounded text-xs">
                <p className="font-medium text-gray-800 line-clamp-2">
                  {paper.title}
                </p>
                <div className="flex justify-between mt-1 text-gray-500">
                  <span>{paper.year || 'N/A'}</span>
                  <span>{(paper.citation_count || 0).toLocaleString()} citations</span>
                  <span className="px-1.5 py-0.5 rounded text-xs"
                        style={{ backgroundColor: `${getModelConfig(paper.modelName)?.color}20`,
                                 color: getModelConfig(paper.modelName)?.color }}>
                    {paper.modelName}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {data.papers.length > 5 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-xs text-blue-600 mt-2 hover:underline flex items-center gap-1"
            >
              {showAll ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Show more</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Inter-Sphere Connection Matrix ──────────────────────────────────────────

const InterSphereMatrix = ({ sphereData, interSphereLinks }) => {
  const sphereNames = Object.keys(SPHERE_DEFINITIONS);
  const [selectedCell, setSelectedCell] = useState(null);

  // Build matrix
  const matrix = {};
  for (const s1 of sphereNames) {
    matrix[s1] = {};
    for (const s2 of sphereNames) {
      matrix[s1][s2] = 0;
    }
  }
  for (const link of interSphereLinks) {
    const [s1, s2] = link.spheres;
    matrix[s1][s2] = link.count;
    matrix[s2][s1] = link.count;
  }

  const maxVal = Math.max(...interSphereLinks.map(l => l.count), 1);

  const getIntensity = (val) => {
    if (val === 0) return 'bg-gray-50 text-gray-400';
    const pct = val / maxVal;
    if (pct < 0.2) return 'bg-blue-100 text-blue-700';
    if (pct < 0.4) return 'bg-blue-200 text-blue-800';
    if (pct < 0.6) return 'bg-blue-400 text-white';
    if (pct < 0.8) return 'bg-blue-600 text-white';
    return 'bg-blue-800 text-white';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center mb-4">
        <BarChart3 className="text-indigo-600 mr-3" size={24} />
        <div>
          <h2 className="text-xl font-bold text-gray-900">Inter-Sphere Connection Matrix</h2>
          <p className="text-sm text-gray-600">Papers that bridge multiple Earth system spheres</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-xs text-gray-500"></th>
              {sphereNames.map(name => (
                <th key={name} className="p-2 text-xs font-semibold text-gray-700 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: SPHERE_DEFINITIONS[name].color }} />
                    {name}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sphereNames.map((row) => (
              <tr key={row}>
                <td className="p-2 text-xs font-semibold text-gray-700 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: SPHERE_DEFINITIONS[row].color }} />
                    {row}
                  </div>
                </td>
                {sphereNames.map((col) => {
                  const val = matrix[row][col];
                  const isDiagonal = row === col;
                  return (
                    <td key={col}
                        className={`p-2 text-center text-xs font-medium border border-gray-100 ${
                          isDiagonal ? 'bg-gray-100 text-gray-400' : `${getIntensity(val)} cursor-pointer hover:ring-2 hover:ring-indigo-400`
                        }`}
                        onClick={() => !isDiagonal && val > 0 && setSelectedCell({ row, col, val })}
                    >
                      {isDiagonal ? '—' : val > 0 ? val.toLocaleString() : '·'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedCell && (
        <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-indigo-800">
              {selectedCell.row} ↔ {selectedCell.col}: {selectedCell.val.toLocaleString()} shared papers
            </span>
            <button onClick={() => setSelectedCell(null)}
                    className="text-indigo-400 hover:text-indigo-600 text-xs">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Summary Statistics ──────────────────────────────────────────────────────

const SummaryStats = ({ sphereData, interSphereLinks, totalPapers }) => {
  const sphereNames = Object.keys(SPHERE_DEFINITIONS);
  const classifiedPapers = sphereNames.reduce((sum, s) => sum + (sphereData[s]?.paperCount || sphereData[s]?.papers?.length || 0), 0);
  const bridgingPapers = interSphereLinks.reduce((sum, l) => sum + l.count, 0);
  const totalCitations = sphereNames.reduce((sum, s) => sum + (sphereData[s]?.totalCitations || 0), 0);

  const stats = [
    { label: 'Total Papers', value: totalPapers.toLocaleString(), color: '#3B82F6' },
    { label: 'Classified', value: classifiedPapers.toLocaleString(), color: '#10B981' },
    { label: 'Cross-Sphere Links', value: bridgingPapers.toLocaleString(), color: '#8B5CF6' },
    { label: 'Total Citations', value: totalCitations.toLocaleString(), color: '#F59E0B' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map(s => (
        <div key={s.label} className="bg-white rounded-lg shadow-sm p-4 border-t-4" style={{ borderColor: s.color }}>
          <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          <p className="text-sm text-gray-600">{s.label}</p>
        </div>
      ))}
    </div>
  );
};

// ─── Top Cross-Sphere Papers Table ───────────────────────────────────────────

const CrossSpherePapersTable = ({ interSphereLinks, sphereData }) => {
  const [expanded, setExpanded] = useState(false);

  // Collect papers that appear in multiple spheres
  const crossPapers = [];
  const seen = new Set();

  for (const link of interSphereLinks) {
    for (const entry of link.papers) {
      const id = entry.paper?.doi || entry.paper?.paper_id || entry.paper?.title;
      if (seen.has(id)) continue;
      seen.add(id);
      crossPapers.push({
        title: entry.paper?.title || 'Untitled',
        year: entry.paper?.year,
        citations: entry.citations || 0,
        spheres: Array.from(entry.spheres),
        models: Array.from(entry.models),
        doi: entry.paper?.doi,
      });
    }
  }

  crossPapers.sort((a, b) => b.spheres.length - a.spheres.length || b.citations - a.citations);
  const displayPapers = expanded ? crossPapers.slice(0, 30) : crossPapers.slice(0, 10);

  if (crossPapers.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Filter className="text-purple-600 mr-3" size={24} />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Cross-Sphere Papers</h2>
            <p className="text-sm text-gray-600">
              {crossPapers.length} papers bridging multiple Earth system spheres
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Spheres</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Title</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Models</th>
              <th className="text-right py-2 px-3 text-xs font-semibold text-gray-600">Year</th>
              <th className="text-right py-2 px-3 text-xs font-semibold text-gray-600">Citations</th>
            </tr>
          </thead>
          <tbody>
            {displayPapers.map((paper, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-2 px-3">
                  <div className="flex flex-wrap gap-1">
                    {paper.spheres.map(s => (
                      <span key={s} className="px-1.5 py-0.5 text-xs rounded-full text-white"
                            style={{ backgroundColor: SPHERE_DEFINITIONS[s]?.color || '#9CA3AF' }}>
                        {s.slice(0, 4)}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-2 px-3">
                  <p className="text-xs text-gray-800 line-clamp-2">{paper.title}</p>
                  {paper.doi && (
                    <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noopener noreferrer"
                       className="text-xs text-blue-500 hover:underline flex items-center gap-0.5 mt-0.5">
                      <ExternalLink size={10} /> DOI
                    </a>
                  )}
                </td>
                <td className="py-2 px-3">
                  <div className="flex flex-wrap gap-1">
                    {paper.models.map(m => (
                      <span key={m} className="px-1.5 py-0.5 text-xs rounded"
                            style={{ backgroundColor: `${getModelConfig(m)?.color}20`,
                                     color: getModelConfig(m)?.color }}>
                        {m}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-2 px-3 text-right text-xs text-gray-600">{paper.year || '—'}</td>
                <td className="py-2 px-3 text-right text-xs font-medium">{paper.citations.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {crossPapers.length > 10 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-sm text-blue-600 hover:underline flex items-center gap-1"
        >
          {expanded ? <><ChevronUp size={14} /> Show less</> : <><ChevronDown size={14} /> Show all {crossPapers.length}</>}
        </button>
      )}
    </div>
  );
};

// ─── Main Page Component ─────────────────────────────────────────────────────

const EarthSystemPage = () => {
  const [allModelsData, setAllModelsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedSphere, setSelectedSphere] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { loadAllEngagedModelsData } = await import('../utils/dataLoader');
        const models = ['RAPID', 'CMS-Flux', 'ECCO', 'ISSM', 'MOMO-CHEM', 'CARDAMOM', 'LES', 'EDMF'];
        const data = await loadAllEngagedModelsData(models);
        setAllModelsData(data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load models data:', error);
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const analysis = useMemo(() => {
    if (!Object.keys(allModelsData).length) return null;
    return classifyAllPapers(allModelsData);
  }, [allModelsData]);

  const totalPapers = Object.values(allModelsData).reduce(
    (sum, papers) => sum + (Array.isArray(papers) ? papers.length : 0), 0
  );

  return (
    <div className="bg-gray-100 min-h-screen">
      <NavBar activeItem="Earth System" />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Globe size={32} className="text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Earth System Interconnections</h1>
          </div>
          <p className="text-gray-600 max-w-3xl">
            All JEME model publications classified into Earth's five interconnected spheres — Atmosphere,
            Hydrosphere, Cryosphere, Biosphere, and Geosphere — revealing how scientific research
            bridges across Earth system boundaries.
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg p-8 shadow-sm text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Classifying papers into Earth system spheres...</p>
          </div>
        ) : analysis ? (
          <div className="space-y-6">
            {/* Summary Statistics */}
            <SummaryStats
              sphereData={analysis.sphereData}
              interSphereLinks={analysis.interSphereLinks}
              totalPapers={totalPapers}
            />

            {/* Sphere Overview Cards */}
            <SphereOverviewCards
              sphereData={analysis.sphereData}
              onSelectSphere={setSelectedSphere}
              selectedSphere={selectedSphere}
            />

            {/* Sphere Detail Panel */}
            {selectedSphere && (
              <SphereDetailPanel
                sphereName={selectedSphere}
                data={analysis.sphereData[selectedSphere]}
              />
            )}

            {/* Network Graph */}
            <EarthSystemGraph
              sphereData={analysis.sphereData}
              interSphereLinks={analysis.interSphereLinks}
              modelSphereConnections={analysis.modelSphereConnections}
            />

            {/* Inter-Sphere Matrix */}
            <InterSphereMatrix
              sphereData={analysis.sphereData}
              interSphereLinks={analysis.interSphereLinks}
            />

            {/* Cross-Sphere Papers */}
            <CrossSpherePapersTable
              interSphereLinks={analysis.interSphereLinks}
              sphereData={analysis.sphereData}
            />
          </div>
        ) : (
          <div className="bg-white rounded-lg p-8 shadow-sm text-center">
            <p className="text-gray-600">Failed to classify papers. Please try again.</p>
          </div>
        )}

        <Footer />
      </main>
    </div>
  );
};

export default EarthSystemPage;

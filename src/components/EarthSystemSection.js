// Earth System Section for individual model dashboards
// Shows how a model's papers distribute across Earth's five spheres
import React, { useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from 'recharts';
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

// Custom active shape for the pie chart - expands the selected slice
const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;
  return (
    <g>
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius - 4}
        outerRadius={outerRadius + 12}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke="#fff"
        strokeWidth={3}
      />
      <Sector
        cx={cx} cy={cy}
        innerRadius={outerRadius + 16}
        outerRadius={outerRadius + 20}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.3}
      />
      <text x={cx} y={cy - 10} textAnchor="middle" className="text-sm font-bold" fill="#1F2937">
        {payload.name}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" className="text-lg font-bold" fill={fill}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    </g>
  );
};

const EarthSystemSection = ({ modelName, citationsData }) => {
  const [selectedSphere, setSelectedSphere] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showAllPapers, setShowAllPapers] = useState(false);

  const analysis = useMemo(() => {
    if (!citationsData || citationsData.length === 0) return null;
    return classifyAllPapers({ [modelName]: citationsData });
  }, [modelName, citationsData]);

  const onPieEnter = useCallback((_, index) => {
    setActiveIndex(index);
  }, []);

  if (!analysis) return null;

  const { sphereData } = analysis;

  // Get all spheres for this model (including those with zero papers), sorted by count
  const modelSpheres = Object.entries(sphereData)
    .filter(([name]) => name !== 'Unclassified')
    .map(([name, data]) => ({
      name,
      ...data,
      modelPaperCount: data.models[modelName] || 0,
    }))
    .sort((a, b) => b.modelPaperCount - a.modelPaperCount);

  const totalClassified = modelSpheres.reduce((sum, s) => sum + s.modelPaperCount, 0);
  const unclassifiedCount = sphereData['Unclassified']?.models[modelName] || 0;
  const totalPapers = totalClassified + unclassifiedCount;

  // Primary sphere = the one with the most papers
  const primarySphere = modelSpheres[0];

  // Prepare pie chart data
  const pieData = modelSpheres.map(s => ({
    name: s.name,
    value: s.modelPaperCount,
    color: s.color,
    totalCitations: s.totalCitations || 0,
  }));
  if (unclassifiedCount > 0) {
    pieData.push({ name: 'Unclassified', value: unclassifiedCount, color: '#9CA3AF', totalCitations: 0 });
  }

  const selectedData = selectedSphere ? sphereData[selectedSphere] : null;
  const selectedPapers = selectedData
    ? [...selectedData.papers].sort((a, b) => (b.citation_count || 0) - (a.citation_count || 0)).slice(0, showAllPapers ? 15 : 5)
    : [];

  const handlePieClick = (data) => {
    const name = data.name;
    if (name === 'Unclassified') return;
    setSelectedSphere(selectedSphere === name ? null : name);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Globe size={24} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Earth System Spheres</h2>
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

      {/* Pie Chart + Legend Layout */}
      <div className="flex flex-col lg:flex-row items-center gap-6 mb-4">
        {/* Pie Chart */}
        <div className="w-full lg:w-1/2" style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                onMouseEnter={onPieEnter}
                onClick={handlePieClick}
                style={{ cursor: 'pointer', outline: 'none' }}
              >
                {pieData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={entry.color}
                    stroke="#fff"
                    strokeWidth={2}
                    opacity={selectedSphere && selectedSphere !== entry.name ? 0.4 : 1}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${value.toLocaleString()} papers`, name]}
                contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Interactive Legend */}
        <div className="w-full lg:w-1/2 space-y-2">
          {modelSpheres.map(sphere => {
            const Icon = SPHERE_ICONS[sphere.name];
            const pct = Math.round((sphere.modelPaperCount / totalPapers) * 100);
            const isSelected = selectedSphere === sphere.name;
            const isPrimary = sphere.name === primarySphere?.name;

            return (
              <button
                key={sphere.name}
                onClick={() => setSelectedSphere(isSelected ? null : sphere.name)}
                className={`w-full text-left p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                  isSelected
                    ? 'border-blue-500 shadow-md bg-blue-50'
                    : 'border-gray-100 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                {/* Color dot + icon */}
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${sphere.color}20` }}>
                  <Icon size={20} style={{ color: sphere.color }} />
                </div>

                {/* Name + primary badge */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-gray-900">{sphere.name}</span>
                    {isPrimary && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
                        Primary
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{(sphere.totalCitations || 0).toLocaleString()} citations</p>
                </div>

                {/* Percentage bar */}
                <div className="w-24 flex-shrink-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-gray-900">{pct}%</span>
                    <span className="text-xs text-gray-500">{sphere.modelPaperCount.toLocaleString()}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: sphere.color }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
          {unclassifiedCount > 0 && (
            <div className="text-xs text-gray-400 pl-3 pt-1">
              + {unclassifiedCount.toLocaleString()} unclassified papers
            </div>
          )}
        </div>
      </div>

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

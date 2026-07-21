// src/components/charts/PaperTypeCard.js
// Paper type (science vs algorithm) distribution card, styled like ResearchDomainsCard

import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { MoreHorizontal, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

const TYPE_COLORS = {
  'Science':       '#10B981',
  'Algorithm':     '#3B82F6',
  'Unclassified':  '#D1D5DB',
};

const PaperTypeCard = ({ data = [] }) => {
  const [expandedType, setExpandedType] = useState(null);

  const { pieData, totalClassified } = useMemo(() => {
    const science     = data.filter(p => p.paper_type === 'science');
    const algorithm   = data.filter(p => p.paper_type === 'algorithm');
    const unclassified = data.filter(p => !p.paper_type);
    const total = data.length || 1;

    const entries = [
      { name: 'Science',      value: science.length,      papers: science },
      { name: 'Algorithm',    value: algorithm.length,    papers: algorithm },
      { name: 'Unclassified', value: unclassified.length, papers: unclassified },
    ]
      .filter(e => e.value > 0)
      .map(e => ({
        ...e,
        color: TYPE_COLORS[e.name],
        percentage: ((e.value / total) * 100).toFixed(1),
      }));

    return { pieData: entries, totalClassified: science.length + algorithm.length };
  }, [data]);

  const expandedPapers = useMemo(() => {
    const entry = pieData.find(e => e.name === expandedType);
    if (!entry) return [];
    return [...entry.papers].sort((a, b) => {
      const ca = a['is-referenced-by-count'] || a.citation_count || 0;
      const cb = b['is-referenced-by-count'] || b.citation_count || 0;
      return cb - ca;
    });
  }, [expandedType, pieData]);

  const getPaperLink = (paper) => {
    const doi = paper.doi || paper.DOI;
    if (doi) return `https://doi.org/${doi}`;
    return paper.url || paper.URL || null;
  };

  const getPaperTitle = (paper) =>
    Array.isArray(paper.title) ? paper.title[0] || 'Untitled' : paper.title || 'Untitled';

  const escapeHtml = (str) =>
    String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));

  const openInNewWindow = (item) => {
    const papers = [...item.papers].sort((a, b) => {
      const ca = a['is-referenced-by-count'] || a.citation_count || 0;
      const cb = b['is-referenced-by-count'] || b.citation_count || 0;
      return cb - ca;
    });

    const rows = papers.map((paper) => {
      const link = getPaperLink(paper);
      const title = escapeHtml(getPaperTitle(paper));
      const year = paper.year || '';
      const citations = paper['is-referenced-by-count'] || paper.citation_count || 0;
      const rationale = paper.paper_type_rationale ? escapeHtml(paper.paper_type_rationale) : '';

      return `
        <div class="paper">
          <div class="title">
            ${link ? `<a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">${title}</a>` : title}
          </div>
          ${rationale ? `<div class="rationale">${rationale}</div>` : ''}
          <div class="meta">${year ? `<span>${year}</span>` : ''}${citations > 0 ? `<span>${citations} citations</span>` : ''}</div>
        </div>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${escapeHtml(item.name)} Papers</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 24px; background: #f9fafb; color: #111827; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .subtitle { color: #6b7280; font-size: 13px; margin-bottom: 20px; }
  .paper { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; margin-bottom: 10px; }
  .title { font-size: 14px; font-weight: 500; }
  .title a { color: #1d4ed8; text-decoration: none; }
  .title a:hover { text-decoration: underline; }
  .rationale { font-size: 12px; color: #9ca3af; font-style: italic; margin-top: 4px; }
  .meta { font-size: 12px; color: #6b7280; margin-top: 6px; display: flex; gap: 12px; }
</style>
</head>
<body>
  <h1>${escapeHtml(item.name)}</h1>
  <div class="subtitle">${papers.length} paper${papers.length === 1 ? '' : 's'}</div>
  ${rows}
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{d.name}</p>
          <p className="text-sm text-gray-600">{`${d.value} papers (${d.percentage}%)`}</p>
        </div>
      );
    }
    return null;
  };

  if (!data.some(p => p.paper_type)) return null;

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm h-full">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-base font-semibold text-gray-800">Paper Type Classification</div>
          <div className="text-sm text-gray-500 mt-1">
            Science vs algorithm papers • {totalClassified} classified of {data.length}
          </div>
        </div>
        <button className="text-gray-500 hover:text-gray-700 p-1">
          <MoreHorizontal size={18} />
        </button>
      </div>

      <div className="h-56 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                const radius = innerRadius + (outerRadius - innerRadius) * 1.3;
                const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                return percent > 0.05 ? (
                  <text x={x} y={y} fill="#374151" textAnchor="middle"
                    dominantBaseline="middle" fontSize={11} fontWeight={500}>
                    {`${(percent * 100).toFixed(0)}%`}
                  </text>
                ) : null;
              }}
            >
              {pieData.map((entry, i) => (
                <Cell key={i} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-1 max-h-64 overflow-y-auto">
        {pieData.map((item, index) => (
          <div key={index}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => setExpandedType(prev => prev === item.name ? null : item.name)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedType(prev => prev === item.name ? null : item.name); } }}
              className="w-full text-left hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors group cursor-pointer"
            >
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <div className="w-3 h-3 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <div className="text-sm font-medium text-gray-800 truncate flex-1">{item.name}</div>
                  </div>
                  <div className="ml-5">
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${item.percentage}%`, backgroundColor: item.color }} />
                    </div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-700 ml-4 w-10 text-right">{item.value}</div>
                <div className="text-xs text-gray-500 ml-2 w-10 text-right">{item.percentage}%</div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); openInNewWindow(item); }}
                  className="ml-2 p-1 text-gray-400 hover:text-blue-600 rounded"
                  title={`Open ${item.name} papers in a new window`}
                >
                  <ExternalLink size={14} />
                </button>
                <div className="ml-1 text-gray-400">
                  {expandedType === item.name ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </div>
            </div>

            {expandedType === item.name && (
              <div className="mx-2 mb-2 border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600 border-b border-gray-200">
                  {expandedPapers.length} {item.name} papers
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                  {expandedPapers.map((paper, pi) => {
                    const link = getPaperLink(paper);
                    const title = getPaperTitle(paper);
                    const year = paper.year || '';
                    const citations = paper['is-referenced-by-count'] || paper.citation_count || 0;
                    return (
                      <div key={pi} className="px-3 py-2 hover:bg-blue-50 transition-colors">
                        {link ? (
                          <a href={link} target="_blank" rel="noopener noreferrer"
                            className="text-xs font-medium text-blue-700 hover:text-blue-900 hover:underline flex items-start gap-1 group">
                            <span className="flex-1 leading-relaxed">{title}</span>
                            <ExternalLink size={11} className="mt-0.5 flex-shrink-0 opacity-60 group-hover:opacity-100" />
                          </a>
                        ) : (
                          <span className="text-xs font-medium text-gray-700 leading-relaxed">{title}</span>
                        )}
                        {paper.paper_type_rationale && (
                          <p className="text-xs text-gray-400 mt-0.5 italic leading-snug line-clamp-2">
                            {paper.paper_type_rationale}
                          </p>
                        )}
                        <div className="flex gap-3 mt-0.5 text-xs text-gray-400">
                          {year && <span>{year}</span>}
                          {citations > 0 && <span>{citations} citations</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {pieData.find(e => e.name === 'Science')?.value || 0}
            </div>
            <div className="text-xs text-gray-500">Science</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {pieData.find(e => e.name === 'Algorithm')?.value || 0}
            </div>
            <div className="text-xs text-gray-500">Algorithm</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {data.length > 0 ? ((totalClassified / data.length) * 100).toFixed(0) : 0}%
            </div>
            <div className="text-xs text-gray-500">Classified</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaperTypeCard;

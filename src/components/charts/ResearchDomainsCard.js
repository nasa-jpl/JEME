// src/components/charts/ResearchDomainsCard.js
// Chart showing research domains distribution

import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { MoreHorizontal, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import colors from '../../utils/colors';

const ResearchDomainsCard = ({ data = [] }) => {
  const [expandedDomain, setExpandedDomain] = useState(null);

  const citationsData = useMemo(() => data || [], [data]);

  const domainData = useMemo(() => {
    const domainCounts = {};
    citationsData.forEach(paper => {
      const domains = (paper.research_domains && paper.research_domains.length > 0)
        ? paper.research_domains
        : (paper.research_domain ? [paper.research_domain] : []);
      domains.forEach(domain => {
        if (domain && domain !== "Unknown" && domain !== "Not specified") {
          domainCounts[domain] = (domainCounts[domain] || 0) + 1;
        }
      });
    });

    const domainArray = Object.entries(domainCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const total = domainArray.reduce((sum, item) => sum + item.value, 0);

    const domainColors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
      '#06B6D4', '#F97316', '#EC4899', '#84CC16', '#6366F1',
      '#14B8A6', '#F472B6',
    ];

    return domainArray.map((item, index) => ({
      ...item,
      color: domainColors[index % domainColors.length],
      percentage: ((item.value / total) * 100).toFixed(1)
    })).slice(0, 10);
  }, [citationsData]);

  const totalDomains = useMemo(() => {
    const uniqueDomains = new Set();
    citationsData.forEach(paper => {
      const domains = (paper.research_domains && paper.research_domains.length > 0)
        ? paper.research_domains
        : (paper.research_domain ? [paper.research_domain] : []);
      domains.forEach(d => {
        if (d && d !== "Unknown" && d !== "Not specified") uniqueDomains.add(d);
      });
    });
    return uniqueDomains.size;
  }, [citationsData]);

  const getPapersForDomain = (domainName) => {
    return citationsData
      .filter(paper => {
        const domains = (paper.research_domains && paper.research_domains.length > 0)
          ? paper.research_domains
          : (paper.research_domain ? [paper.research_domain] : []);
        return domains.includes(domainName);
      })
      .sort((a, b) => {
        const ca = a['is-referenced-by-count'] || a.citation_count || 0;
        const cb = b['is-referenced-by-count'] || b.citation_count || 0;
        return cb - ca;
      });
  };

  // Papers for the expanded domain
  const expandedPapers = useMemo(() => {
    if (!expandedDomain) return [];
    return getPapersForDomain(expandedDomain);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedDomain, citationsData]);

  const getPaperLink = (paper) => {
    const doi = paper.doi || paper.DOI;
    if (doi) return `https://doi.org/${doi}`;
    return paper.url || paper.URL || null;
  };

  const getPaperTitle = (paper) => {
    if (Array.isArray(paper.title)) return paper.title[0] || 'Untitled';
    return paper.title || 'Untitled';
  };

  const handleDomainClick = (domainName) => {
    setExpandedDomain(prev => prev === domainName ? null : domainName);
  };

  const escapeHtml = (str) =>
    String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));

  const openInNewWindow = (item) => {
    const papers = getPapersForDomain(item.name);

    const rows = papers.map((paper) => {
      const link = getPaperLink(paper);
      const title = escapeHtml(getPaperTitle(paper));
      const year = paper.year || '';
      const citations = paper['is-referenced-by-count'] || paper.citation_count || 0;

      return `
        <div class="paper">
          <div class="title">
            ${link ? `<a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">${title}</a>` : title}
          </div>
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

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm h-full">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-base font-semibold text-gray-800">Research Domains</div>
          <div className="text-sm text-gray-500 mt-1">
            Scientific fields of papers citing this model • {totalDomains} domains identified
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
              data={domainData}
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
                  <text x={x} y={y} fill={colors.gray700 || "#374151"} textAnchor="middle"
                    dominantBaseline="middle" fontSize={11} fontWeight={500}>
                    {`${(percent * 100).toFixed(0)}%`}
                  </text>
                ) : null;
              }}
            >
              {domainData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-1 max-h-64 overflow-y-auto">
        {domainData.map((item, index) => (
          <div key={index}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => handleDomainClick(item.name)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleDomainClick(item.name); } }}
              className="w-full text-left hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors group cursor-pointer"
            >
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <div className="w-3 h-3 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <div className="text-sm font-medium text-gray-800 truncate flex-1" title={item.name}>
                      {item.name}
                    </div>
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
                  {expandedDomain === item.name ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </div>
            </div>

            {/* Expanded paper list */}
            {expandedDomain === item.name && (
              <div className="mx-2 mb-2 border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600 border-b border-gray-200">
                  {expandedPapers.length} papers in {item.name}
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
            <div className="text-lg font-semibold text-gray-900">{domainData.length}</div>
            <div className="text-xs text-gray-500">Top Domains</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">{citationsData.length}</div>
            <div className="text-xs text-gray-500">Total Papers</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">{domainData.length > 0 ? domainData[0].percentage : 0}%</div>
            <div className="text-xs text-gray-500">Largest Domain</div>
          </div>
        </div>
        {domainData.length > 0 && (
          <div className="mt-2 text-center">
            <div className="text-xs text-gray-600">
              Top domain: <span className="font-medium">{domainData[0].name}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResearchDomainsCard;

// Bridge Papers Table - List of papers appearing in multiple models
import React, { useState } from 'react';
import { FileText, ArrowUpDown, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { getModelConfig } from '../../config/modelConfig';

const BridgePapersTable = ({ bridgePapers }) => {
  const [sortBy, setSortBy] = useState('modelCount'); // modelCount, citationCount, year
  const [sortOrder, setSortOrder] = useState('desc');
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  if (!bridgePapers || bridgePapers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-gray-500">No bridge papers found.</div>
      </div>
    );
  }

  // Sorting
  const sortedPapers = [...bridgePapers].sort((a, b) => {
    let aVal, bVal;

    switch (sortBy) {
      case 'modelCount':
        aVal = a.modelCount;
        bVal = b.modelCount;
        break;
      case 'citationCount':
        aVal = a.citationCount || 0;
        bVal = b.citationCount || 0;
        break;
      case 'year':
        aVal = a.year || 0;
        bVal = b.year || 0;
        break;
      default:
        return 0;
    }

    return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
  });

  // Pagination
  const totalPages = Math.ceil(sortedPapers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPapers = sortedPapers.slice(startIndex, endIndex);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const toggleRow = (index) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const SortButton = ({ field, label }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-purple-600 transition-colors"
    >
      {label}
      <ArrowUpDown
        size={14}
        className={sortBy === field ? 'text-purple-600' : 'text-gray-400'}
      />
    </button>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FileText className="text-purple-600 mr-3" size={24} />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Bridge Papers</h2>
            <p className="text-sm text-gray-600">
              {bridgePapers.length} papers citing multiple models
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="modelCount" label="Models" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title & Authors
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="year" label="Year" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="citationCount" label="Citations" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Venue
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentPapers.map((paper, index) => {
              const globalIndex = startIndex + index;
              const isExpanded = expandedRows.has(globalIndex);

              return (
                <React.Fragment key={globalIndex}>
                  <tr className="hover:bg-gray-50 transition-colors">
                    {/* Models Count */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {paper.models.map(model => {
                          const modelConfig = getModelConfig(model);
                          const modelColor = modelConfig?.color || '#8B5CF6';

                          return (
                            <span
                              key={model}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                              style={{ backgroundColor: modelColor }}
                            >
                              {model}
                            </span>
                          );
                        })}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {paper.modelCount} models
                      </div>
                    </td>

                    {/* Title & Authors */}
                    <td className="px-4 py-4">
                      <div className="max-w-md">
                        <div className="font-medium text-gray-900 line-clamp-2 mb-1">
                          {paper.title}
                        </div>
                        {paper.authors && paper.authors.length > 0 && (
                          <div className="text-sm text-gray-600 line-clamp-1">
                            {paper.authors.slice(0, 3).join(', ')}
                            {paper.authors.length > 3 && ` +${paper.authors.length - 3} more`}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Year */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {paper.year || 'N/A'}
                    </td>

                    {/* Citations */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {paper.citationCount || 0}
                      </div>
                    </td>

                    {/* Venue */}
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-600 max-w-xs line-clamp-2">
                        {paper.venue}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleRow(globalIndex)}
                          className="text-purple-600 hover:text-purple-800 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronUp size={18} />
                          ) : (
                            <ChevronDown size={18} />
                          )}
                        </button>
                        {paper.doi && (
                          <a
                            href={`https://doi.org/${paper.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="View paper"
                          >
                            <ExternalLink size={18} />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Row */}
                  {isExpanded && (
                    <tr>
                      <td colSpan="6" className="px-4 py-4 bg-gray-50">
                        <div className="space-y-3">
                          {/* Full Author List */}
                          {paper.authors && paper.authors.length > 0 && (
                            <div>
                              <span className="font-semibold text-gray-700">Authors: </span>
                              <span className="text-gray-600">{paper.authors.join(', ')}</span>
                            </div>
                          )}

                          {/* DOI */}
                          {paper.doi && (
                            <div>
                              <span className="font-semibold text-gray-700">DOI: </span>
                              <a
                                href={`https://doi.org/${paper.doi}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline"
                              >
                                {paper.doi}
                              </a>
                            </div>
                          )}

                          {/* Research Domain */}
                          {paper.researchDomain && paper.researchDomain !== 'Unknown' && (
                            <div>
                              <span className="font-semibold text-gray-700">Research Domain: </span>
                              <span className="text-gray-600">{paper.researchDomain}</span>
                            </div>
                          )}

                          {/* Connected Models */}
                          <div>
                            <span className="font-semibold text-gray-700">Connected Models: </span>
                            <span className="text-gray-600">{paper.models.join(' ↔ ')}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1}-{Math.min(endIndex, bridgePapers.length)} of {bridgePapers.length} papers
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BridgePapersTable;

// src/components/charts/GitHubMetricsCard.js
// Card showing GitHub repository metrics with live data from GitHub API

import React, { useState, useEffect } from 'react';
import { ExternalLink, Loader2, GitBranch, Star, GitFork, AlertCircle, Users, Calendar, Code } from 'lucide-react';

const GitHubMetricsCard = ({ owner = 'c-h-david', repo = 'rapid' }) => {
  const [metrics, setMetrics] = useState([]);
  const [repoInfo, setRepoInfo] = useState({});
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGitHubData = async () => {
    try {
      setLoading(true);
      
      // Fetch repository data
      const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
      if (!repoResponse.ok) throw new Error('Failed to fetch repository data');
      const repoData = await repoResponse.json();

      // Fetch contributors count
      const contributorsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contributors?per_page=1`);
      let contributorsCount = 0;
      if (contributorsResponse.ok) {
        const linkHeader = contributorsResponse.headers.get('Link');
        if (linkHeader) {
          const lastPageMatch = linkHeader.match(/page=(\d+)>; rel="last"/);
          contributorsCount = lastPageMatch ? parseInt(lastPageMatch[1]) : 1;
        } else {
          const contributors = await contributorsResponse.json();
          contributorsCount = contributors.length;
        }
      }

      // Fetch languages
      const languagesResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`);
      let languageData = {};
      if (languagesResponse.ok) {
        languageData = await languagesResponse.json();
      }

      // Process languages for visualization
      const totalBytes = Object.values(languageData).reduce((sum, bytes) => sum + bytes, 0);
      const processedLanguages = Object.entries(languageData)
        .map(([name, bytes]) => ({
          name,
          bytes,
          percentage: ((bytes / totalBytes) * 100).toFixed(1)
        }))
        .sort((a, b) => b.bytes - a.bytes)
        .slice(0, 5); // Top 5 languages

      // Calculate metrics with icons
      const calculatedMetrics = [
        {
          metric: 'Stars',
          value: repoData.stargazers_count?.toLocaleString() || '0',
          icon: Star,
          color: 'text-yellow-600'
        },
        {
          metric: 'Forks', 
          value: repoData.forks_count?.toLocaleString() || '0',
          icon: GitFork,
          color: 'text-blue-600'
        },
        {
          metric: 'Issues',
          value: repoData.open_issues_count?.toLocaleString() || '0',
          icon: AlertCircle,
          color: 'text-red-600'
        },
        {
          metric: 'Contributors',
          value: contributorsCount.toLocaleString(),
          icon: Users,
          color: 'text-green-600'
        }
      ];

      // Store additional repo info
      const additionalInfo = {
        description: repoData.description,
        language: repoData.language,
        created_at: repoData.created_at,
        updated_at: repoData.updated_at,
        size: repoData.size,
        default_branch: repoData.default_branch,
        license: repoData.license?.name
      };

      setMetrics(calculatedMetrics);
      setRepoInfo(additionalInfo);
      setLanguages(processedLanguages);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching GitHub data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGitHubData();
  }, [owner, repo]);

  // Language colors mapping
  const getLanguageColor = (language) => {
    const colors = {
      'JavaScript': '#f1e05a',
      'Python': '#3572A5',
      'Java': '#b07219',
      'C++': '#f34b7d',
      'C': '#555555',
      'HTML': '#e34c26',
      'CSS': '#563d7c',
      'TypeScript': '#2b7489',
      'Go': '#00ADD8',
      'Rust': '#dea584',
      'Ruby': '#701516',
      'PHP': '#4F5D95',
      'Swift': '#ffac45',
      'Kotlin': '#F18E33',
      'Shell': '#89e051',
      'Fortran': '#4d41b1',
      'Jupyter Notebook': '#DA5B0B'
    };
    return colors[language] || '#8b5cf6';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-5 shadow-sm h-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 size={20} className="animate-spin" />
          <span>Loading GitHub metrics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg p-5 shadow-sm h-full">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-base font-semibold text-gray-800">GitHub Repository Metrics</div>
            <div className="text-sm text-gray-500 mt-1">{owner}/{repo}</div>
          </div>
          <button 
            onClick={fetchGitHubData}
            className="text-gray-500 hover:text-gray-700 p-1"
            title="Retry"
          >
            <ExternalLink size={18} />
          </button>
        </div>
        <div className="text-red-500 text-sm">
          Error loading data: {error}
          <button 
            onClick={fetchGitHubData}
            className="ml-2 text-blue-500 hover:text-blue-700 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm h-full">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-base font-semibold text-gray-800">GitHub Repository Metrics</div>
          <div className="text-sm text-gray-500 mt-1">{owner}/{repo}</div>
          {repoInfo.description && (
            <div className="text-xs text-gray-400 mt-1 max-w-xs truncate">
              {repoInfo.description}
            </div>
          )}
        </div>
        <a 
          href={`https://github.com/${owner}/${repo}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 hover:text-gray-700 p-1"
          title="View on GitHub"
        >
          <ExternalLink size={18} />
        </a>
      </div>
      
      <div className="grid grid-cols-4 gap-4 mb-6">
        {metrics.map((metric, index) => {
          const IconComponent = metric.icon;
          return (
            <div key={index} className="p-3 bg-gray-50 rounded-lg text-center border">
              <div className="flex items-center justify-center mb-1">
                <IconComponent size={16} className={metric.color} />
              </div>
              <div className="text-lg font-semibold text-gray-900">{metric.value}</div>
              <div className="text-xs text-gray-500">{metric.metric}</div>
            </div>
          );
        })}
      </div>

      {/* Repository Details */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
          <Code size={14} />
          Repository Details
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {repoInfo.language && (
            <div className="flex justify-between">
              <span className="text-gray-500">Primary Language:</span>
              <span className="font-medium">{repoInfo.language}</span>
            </div>
          )}
          {repoInfo.size && (
            <div className="flex justify-between">
              <span className="text-gray-500">Size:</span>
              <span className="font-medium">{(repoInfo.size / 1024).toFixed(1)} MB</span>
            </div>
          )}
          {repoInfo.default_branch && (
            <div className="flex justify-between">
              <span className="text-gray-500">Default Branch:</span>
              <span className="font-medium flex items-center gap-1">
                <GitBranch size={12} />
                {repoInfo.default_branch}
              </span>
            </div>
          )}
          {repoInfo.license && (
            <div className="flex justify-between">
              <span className="text-gray-500">License:</span>
              <span className="font-medium">{repoInfo.license}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Language Distribution */}
      {languages.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-xs font-medium text-gray-700 mb-3">Language Distribution</div>
          <div className="space-y-2">
            {languages.map((lang, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getLanguageColor(lang.name) }}
                  />
                  <span className="text-xs text-gray-700">{lang.name}</span>
                </div>
                <span className="text-xs font-medium text-gray-600">{lang.percentage}%</span>
              </div>
            ))}
          </div>
          
          {/* Language bar */}
          <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden flex">
            {languages.map((lang, index) => (
              <div
                key={index}
                className="h-full"
                style={{ 
                  backgroundColor: getLanguageColor(lang.name),
                  width: `${lang.percentage}%`
                }}
                title={`${lang.name}: ${lang.percentage}%`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GitHubMetricsCard;
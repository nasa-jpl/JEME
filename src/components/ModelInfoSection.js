// ModelInfoSection - Collapsible section displaying model information from markdown files
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { MarkdownContent } from '../utils/markdownUtils';

const ModelInfoSection = ({ modelName, modelDisplayName }) => {
  const [modelInfoExpanded, setModelInfoExpanded] = useState(false);
  const [modelInfo, setModelInfo] = useState(null);

  // Fetch model info from markdown file
  useEffect(() => {
    const fetchModelInfo = async () => {
      try {
        const response = await fetch(`${process.env.PUBLIC_URL}/models/${modelName}.md`);
        if (response.ok) {
          const text = await response.text();
          // Parse markdown sections
          const sections = {};
          const lines = text.split('\n');
          let currentSection = null;
          let currentContent = [];

          lines.forEach(line => {
            if (line.startsWith('## ')) {
              if (currentSection) {
                sections[currentSection] = currentContent.join('\n').trim();
              }
              currentSection = line.replace('## ', '').trim();
              currentContent = [];
            } else if (line.startsWith('# ')) {
              sections.title = line.replace('# ', '').trim();
            } else if (currentSection) {
              currentContent.push(line);
            }
          });

          if (currentSection) {
            sections[currentSection] = currentContent.join('\n').trim();
          }

          setModelInfo(sections);
        }
      } catch (error) {
        console.error('Failed to fetch model info:', error);
      }
    };

    if (modelName) {
      fetchModelInfo();
    }
  }, [modelName]);

  if (!modelInfo) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900">About {modelDisplayName}</h2>
      </div>

      {/* Overview preview - show first 2-3 lines */}
      <div className="text-gray-700 space-y-2">
        {modelInfo.Overview && (
          <div>
            <MarkdownContent
              content={modelInfoExpanded
                ? modelInfo.Overview
                : modelInfo.Overview.split('\n').slice(0, 2).join('\n') + (modelInfo.Overview.split('\n').length > 2 ? '...' : '')}
              className="leading-relaxed"
            />
          </div>
        )}
      </div>

      {/* Expanded content */}
      {modelInfoExpanded && modelInfo && (
        <div className="mt-4 space-y-4 text-gray-700">
          {modelInfo.Background && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Background</h3>
              <MarkdownContent content={modelInfo.Background} className="leading-relaxed" />
            </div>
          )}

          {modelInfo['Key Features'] && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Key Features</h3>
              <MarkdownContent content={modelInfo['Key Features']} className="leading-relaxed" />
            </div>
          )}

          {modelInfo['Scientific Applications'] && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Scientific Applications</h3>
              <MarkdownContent content={modelInfo['Scientific Applications']} className="leading-relaxed" />
            </div>
          )}

          {modelInfo['Technical Details'] && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Technical Details</h3>
              <MarkdownContent content={modelInfo['Technical Details']} className="leading-relaxed" />
            </div>
          )}

          {(modelInfo['Team Members'] || modelInfo['JPL Team Members']) && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">{modelInfo['Team Members'] ? 'Team Members' : 'JPL Team Members'}</h3>
              <MarkdownContent content={modelInfo['Team Members'] || modelInfo['JPL Team Members']} className="leading-relaxed" />
            </div>
          )}

          {modelInfo.Resources && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Resources</h3>
              <MarkdownContent content={modelInfo.Resources} className="leading-relaxed" />
            </div>
          )}
        </div>
      )}

      <div className="mt-4">
        <button
          onClick={() => setModelInfoExpanded(!modelInfoExpanded)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
        >
          {modelInfoExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {modelInfoExpanded ? 'Show Less' : 'Learn More'}
        </button>
      </div>
    </div>
  );
};

export default ModelInfoSection;

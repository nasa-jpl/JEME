import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import NavBar from '../components/NavBar';

const HowItWorks = () => {
  const [content, setContent] = useState('');
  const [mermaidLoaded, setMermaidLoaded] = useState(false);

  // Load Mermaid library
  useEffect(() => {
    if (!window.mermaid) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
      script.async = true;
      script.onload = () => {
        window.mermaid.initialize({ 
          startOnLoad: false,
          theme: 'default',
          themeVariables: {
            primaryColor: '#E0E7FF',
            primaryTextColor: '#1F2937',
            secondaryColor: '#F3F4F6',
            tertiaryColor: '#F9FAFB',
            background: '#FFFFFF',
            mainBkg: '#E0E7FF',
            secondBkg: '#F3F4F6',
            tertiaryBkg: '#F9FAFB',
            primaryBorderColor: '#6366F1',
            lineColor: '#9CA3AF',
            textColor: '#1F2937',
            labelTextColor: '#1F2937',
            nodeTextColor: '#1F2937',
            classText: '#1F2937',
            fillType0: '#E0E7FF',
            fillType1: '#F3F4F6',
            fillType2: '#FEF3C7',
            fillType3: '#DCFCE7',
            fillType4: '#FCE7F3',
            fillType5: '#DBEAFE',
            fillType6: '#E9D5FF',
            fillType7: '#FED7AA'
          }
        });
        setMermaidLoaded(true);
      };
      document.body.appendChild(script);
    } else {
      setMermaidLoaded(true);
    }
  }, []);

  useEffect(() => {
    // Load the markdown content
    fetch('/HOW_IT_WORKS.md')
      .then(response => response.text())
      .then(text => {
        // Extract mermaid diagrams and process them separately
        const mermaidRegex = /```mermaid\n([\s\S]*?)```/g;
        let mermaidDiagrams = [];
        let match;
        let diagramIndex = 0;
        
        while ((match = mermaidRegex.exec(text)) !== null) {
          mermaidDiagrams.push(match[1]);
        }
        
        // Process the markdown content
        let processedText = text
          // Replace mermaid code blocks with placeholders
          .replace(/```mermaid\n([\s\S]*?)```/g, () => {
            const placeholder = `\n<MERMAID_PLACEHOLDER_${diagramIndex}>\n`;
            diagramIndex++;
            return placeholder;
          });
        
        // Split into lines for better processing
        const lines = processedText.split('\n');
        let html = [];
        let inCodeBlock = false;
        let codeBlockContent = [];
        let inList = false;
        let listType = null;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          
          // Handle code blocks
          if (line.startsWith('```')) {
            if (!inCodeBlock) {
              inCodeBlock = true;
              codeBlockContent = [];
            } else {
              inCodeBlock = false;
              html.push(`<pre class="bg-gray-100 rounded-lg p-4 my-4 overflow-x-auto"><code class="text-sm">${codeBlockContent.join('\n')}</code></pre>`);
            }
            continue;
          }
          
          if (inCodeBlock) {
            codeBlockContent.push(line);
            continue;
          }
          
          // Handle mermaid placeholders
          if (line.includes('MERMAID_PLACEHOLDER_')) {
            if (inList) {
              html.push(listType === 'ol' ? '</ol>' : '</ul>');
              inList = false;
            }
            html.push(`<div class="mermaid-placeholder" data-index="${line.match(/MERMAID_PLACEHOLDER_(\d+)/)[1]}"></div>`);
            continue;
          }
          
          // Handle headers
          if (line.startsWith('#')) {
            if (inList) {
              html.push(listType === 'ol' ? '</ol>' : '</ul>');
              inList = false;
            }
            
            if (line.startsWith('### ')) {
              html.push(`<h3 class="text-xl font-bold text-gray-900 mt-6 mb-3">${line.substring(4)}</h3>`);
            } else if (line.startsWith('## ')) {
              html.push(`<h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">${line.substring(3)}</h2>`);
            } else if (line.startsWith('# ')) {
              html.push(`<h1 class="text-3xl font-bold text-gray-900 mb-6">${line.substring(2)}</h1>`);
            } else if (line.startsWith('#### ')) {
              html.push(`<h4 class="text-lg font-semibold text-gray-900 mt-4 mb-2">${line.substring(5)}</h4>`);
            }
            continue;
          }
          
          // Handle lists
          const orderedListMatch = line.match(/^(\d+)\.\s+(.*)$/);
          const unorderedListMatch = line.match(/^-\s+(.*)$/);
          const indentedListMatch = line.match(/^(\s+)-\s+(.*)$/);
          
          if (orderedListMatch) {
            if (!inList || listType !== 'ol') {
              if (inList) html.push('</ul>');
              html.push('<ol class="list-decimal ml-6 my-4">');
              inList = true;
              listType = 'ol';
            }
            let content = orderedListMatch[2]
              .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>')
              .replace(/\*([^*]+)\*/g, '<em>$1</em>')
              .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>');
            html.push(`<li class="mb-2">${content}</li>`);
            continue;
          }
          
          if (indentedListMatch) {
            let content = indentedListMatch[2]
              .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>')
              .replace(/\*([^*]+)\*/g, '<em>$1</em>')
              .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>');
            html.push(`<ul class="list-disc ml-10 my-2"><li class="mb-1">${content}</li></ul>`);
            continue;
          }
          
          if (unorderedListMatch) {
            if (!inList || listType !== 'ul') {
              if (inList) html.push('</ol>');
              html.push('<ul class="list-disc ml-6 my-4">');
              inList = true;
              listType = 'ul';
            }
            let content = unorderedListMatch[1]
              .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>')
              .replace(/\*([^*]+)\*/g, '<em>$1</em>')
              .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>');
            html.push(`<li class="mb-2">${content}</li>`);
            continue;
          }
          
          // Close list if needed
          if (inList && !line.match(/^[\d-]/)) {
            html.push(listType === 'ol' ? '</ol>' : '</ul>');
            inList = false;
          }
          
          // Handle regular paragraphs
          if (line.trim()) {
            let processedLine = line
              .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>')
              .replace(/\*([^*]+)\*/g, '<em>$1</em>')
              .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>');
            
            // Handle inline code blocks
            if (line.trim().startsWith('```') && line.trim().endsWith('```')) {
              html.push(`<div class="bg-gray-100 rounded p-2 my-2 font-mono text-sm">${line.replace(/```/g, '')}</div>`);
            } else {
              html.push(`<p class="mb-4 text-gray-700">${processedLine}</p>`);
            }
          }
        }
        
        // Close any open lists
        if (inList) {
          html.push(listType === 'ol' ? '</ol>' : '</ul>');
        }
        
        // Join all HTML
        html = html.join('\n');
        
        setContent(html);
        
        // Render mermaid diagrams after content is set
        if (mermaidLoaded && mermaidDiagrams.length > 0) {
          setTimeout(() => {
            const placeholders = document.querySelectorAll('.mermaid-placeholder');
            placeholders.forEach((placeholder, index) => {
              if (mermaidDiagrams[index]) {
                const mermaidDiv = document.createElement('div');
                mermaidDiv.className = 'mermaid my-6 flex justify-center';
                mermaidDiv.textContent = mermaidDiagrams[index];
                placeholder.replaceWith(mermaidDiv);
              }
            });
            window.mermaid.run();
          }, 100);
        }
      })
      .catch(error => {
        console.error('Error loading HOW_IT_WORKS.md:', error);
        setContent('<p class="text-red-600">Error loading documentation. Please try again later.</p>');
      });
  }, [mermaidLoaded]);

  // Re-render mermaid diagrams when content changes
  useEffect(() => {
    if (mermaidLoaded && content) {
      const mermaidElements = document.querySelectorAll('.mermaid:not([data-processed="true"])');
      if (mermaidElements.length > 0) {
        window.mermaid.run();
      }
    }
  }, [content, mermaidLoaded]);

  return (
    <div className="bg-gray-100 min-h-screen">
      <NavBar activeItem="How It Works" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Back to Dashboard Link */}
        <Link to="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6">
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </Link>

        {/* Documentation Content */}
        <div className="bg-white rounded-lg p-8 shadow-sm">
          <div className="prose prose-gray max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      </main>
    </div>
  );
};

export default HowItWorks;
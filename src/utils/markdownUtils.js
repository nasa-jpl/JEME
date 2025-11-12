// Simple markdown parser for basic formatting
export const parseMarkdown = (text) => {
  if (!text) return '';

  let html = text;

  // Convert bold text **text** or __text__
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

  // Convert italic text *text* or _text_
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');

  // Convert links [text](url)
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>');

  // Convert plain URLs to clickable links (must come after markdown links)
  html = html.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>');

  // Convert inline code `code`
  html = html.replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>');

  // Convert bullet points - item
  const lines = html.split('\n');
  let inList = false;
  const processedLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const bulletMatch = line.match(/^-\s+(.+)$/);

    if (bulletMatch) {
      if (!inList) {
        processedLines.push('<ul class="list-disc list-inside ml-4 my-1" style="margin-top: 0.25rem; margin-bottom: 0.25rem;">');
        inList = true;
      }
      processedLines.push(`<li style="margin-bottom: 0.125rem;">${bulletMatch[1]}</li>`);
    } else if (line === '' && inList) {
      // Skip empty lines within lists
      continue;
    } else {
      if (inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      if (line !== '') {
        // Wrap regular text in paragraph tags
        processedLines.push(`<p class="my-2">${line}</p>`);
      }
    }
  }

  if (inList) {
    processedLines.push('</ul>');
  }

  return processedLines.join('');
};

// Component to render parsed markdown
export const MarkdownContent = ({ content, className = '' }) => {
  const html = parseMarkdown(content);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

import React from 'react';
import './MarkdownRenderer.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Parses inline formatting like **bold**, *italic*, `code`, and links.
 */
function renderInline(text: string): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining) {
    // Bold: **text** or __text__
    const boldMatch = remaining.match(/^(\*\*|__)(.*?)\1/);
    if (boldMatch) {
      elements.push(<strong key={key++}>{boldMatch[2]}</strong>);
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Inline Code: `text`
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      elements.push(<code key={key++} className="md-inline-code">{codeMatch[1]}</code>);
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Italic: *text* or _text_
    const italicMatch = remaining.match(/^(\*|_)(.*?)\1/);
    if (italicMatch) {
      elements.push(<em key={key++}>{italicMatch[2]}</em>);
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Plain text up to next special char
    const nextSpecial = remaining.search(/[\*_`]/);
    if (nextSpecial === -1) {
      elements.push(remaining);
      break;
    } else if (nextSpecial === 0) {
      elements.push(remaining[0]);
      remaining = remaining.slice(1);
    } else {
      elements.push(remaining.slice(0, nextSpecial));
      remaining = remaining.slice(nextSpecial);
    }
  }

  return elements;
}

/**
 * Checks if a line is a markdown table separator (e.g., |---|---| or |--:|)
 */
function isTableSeparator(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes('|')) return false;
  const parts = trimmed.split('|').filter((p) => p.trim().length > 0);
  return parts.length > 0 && parts.every((p) => /^:?-+:?$/.test(p.trim()));
}

/**
 * Parses markdown blocks including tables, bullet lists, numbered lists, headings, and paragraphs.
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  const lines = content.split(/\r?\n/);
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let blockKey = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Empty lines
    if (!trimmed) {
      i++;
      continue;
    }

    // 2. Headings (#, ##, ###)
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingText = headingMatch[2];
      if (level === 1) {
        blocks.push(<h3 key={blockKey++} className="md-heading md-h1">{renderInline(headingText)}</h3>);
      } else if (level === 2) {
        blocks.push(<h4 key={blockKey++} className="md-heading md-h2">{renderInline(headingText)}</h4>);
      } else if (level === 3) {
        blocks.push(<h5 key={blockKey++} className="md-heading md-h3">{renderInline(headingText)}</h5>);
      } else {
        blocks.push(<h6 key={blockKey++} className="md-heading md-h4">{renderInline(headingText)}</h6>);
      }
      i++;
      continue;
    }

    // 3. Blockquotes (> quote)
    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      blocks.push(
        <blockquote key={blockKey++} className="md-blockquote">
          {quoteLines.map((ql, qidx) => (
            <p key={qidx}>{renderInline(ql)}</p>
          ))}
        </blockquote>
      );
      continue;
    }

    // 4. Markdown Table detection (| header 1 | header 2 |)
    if (trimmed.includes('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const headerCells = trimmed
        .split('|')
        .map((c) => c.trim())
        .filter((_, idx, arr) => (idx === 0 && arr[idx] === '' ? false : idx === arr.length - 1 && arr[idx] === '' ? false : true));

      i += 2; // skip header and separator line
      const tableRows: string[][] = [];

      while (i < lines.length && lines[i].trim().includes('|') && lines[i].trim().length > 0) {
        const rowCells = lines[i]
          .trim()
          .split('|')
          .map((c) => c.trim())
          .filter((_, idx, arr) => (idx === 0 && arr[idx] === '' ? false : idx === arr.length - 1 && arr[idx] === '' ? false : true));
        tableRows.push(rowCells);
        i++;
      }

      blocks.push(
        <div key={blockKey++} className="md-table-wrapper">
          <table className="md-table">
            <thead>
              <tr>
                {headerCells.map((h, hIdx) => (
                  <th key={hIdx}>{renderInline(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx}>{renderInline(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // 5. Bullet Lists (- item, * item, • item)
    if (/^[-*•]\s+/.test(trimmed)) {
      const listItems: string[] = [];
      while (i < lines.length && /^[-*•]\s+/.test(lines[i].trim())) {
        listItems.push(lines[i].trim().replace(/^[-*•]\s+/, ''));
        i++;
      }
      blocks.push(
        <ul key={blockKey++} className="md-unordered-list">
          {listItems.map((item, itemIdx) => (
            <li key={itemIdx}>{renderInline(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // 6. Numbered Lists (1. item, 2. item)
    if (/^\d+\.\s+/.test(trimmed)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        listItems.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i++;
      }
      blocks.push(
        <ol key={blockKey++} className="md-ordered-list">
          {listItems.map((item, itemIdx) => (
            <li key={itemIdx}>{renderInline(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // 7. Regular Paragraph
    blocks.push(
      <p key={blockKey++} className="md-paragraph">
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return <div className={`markdown-content ${className}`}>{blocks}</div>;
};

export default MarkdownRenderer;

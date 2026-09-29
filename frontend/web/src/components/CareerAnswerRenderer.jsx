import React from 'react';

/**
 * Normalizes escaped HTML, stray tags, and markdown quirks from LLMs
 */
export function normalizeAnswerText(raw) {
  if (typeof raw !== 'string') return '';
  let text = raw;

  // 1. Unescape backslash-escaped HTML tags (e.g. \<ul>\<li> -> <ul><li>)
  text = text.replace(/\\<(\/?[a-zA-Z0-9]+)(\s*[^>]*)?\\>/g, '<$1$2>');
  text = text.replace(/\\([<>])/g, '$1');

  // 2. Normalize <br> or <br/> tags to newlines
  text = text.replace(/<br\s*\/?>/gi, '\n');

  // 3. Convert <li>...</li> into markdown bullet lines
  text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, (_, inner) => `- ${inner.trim()}\n`);

  // 4. Strip leftover <ul>, </ul>, <ol>, </ol>, <p>, </p>, <div>, </div> tags
  text = text.replace(/<\/?(?:ul|ol|p|div)[^>]*>/gi, '\n');

  // 5. Unescape common HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');

  return text;
}

/**
 * Parses inline formatting: bold, italic, inline code, citations, links
 */
export function renderInline(text) {
  if (typeof text !== 'string') return null;

  // Pattern matches:
  // 1. ***bold italic***
  // 2. **bold** or __bold__
  // 3. *italic* or _italic_
  // 4. `code`
  // 5. [label](url)
  const tokenRegex = /(\*\*\*[^*]+?\*\*\*|\*\*[^*]+?\*\*|__[^*]+?__|\*[^*]+?\*|_([^_]+)_|`[^`]+?`|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Bold + Italic: ***text***
    if (part.startsWith('***') && part.endsWith('***') && part.length >= 6) {
      return <strong key={index}><em>{part.slice(3, -3)}</em></strong>;
    }
    // Bold: **text** or __text__
    if ((part.startsWith('**') && part.endsWith('**') && part.length >= 4) ||
        (part.startsWith('__') && part.endsWith('__') && part.length >= 4)) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    // Italic: *text* or _text_
    if ((part.startsWith('*') && part.endsWith('*') && part.length >= 2) ||
        (part.startsWith('_') && part.endsWith('_') && part.length >= 2)) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    // Inline code: `code`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return <code key={index} className="advisor-inline-code">{part.slice(1, -1)}</code>;
    }
    // Markdown link: [text](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const href = linkMatch[2];
      const isSafe = href.startsWith('https://') || href.startsWith('http://');
      if (isSafe) {
        return <a key={index} href={href} target="_blank" rel="noopener noreferrer" className="advisor-inline-link">{linkMatch[1]}</a>;
      }
      return linkMatch[1];
    }

    return part;
  });
}

/**
 * Splits normalized markdown into structured blocks:
 * headings, lists, tables, blockquotes, and paragraphs.
 */
export function parseMarkdownBlocks(rawText) {
  const normalized = normalizeAnswerText(rawText);
  const lines = normalized.split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Skip empty lines
    if (!trimmed) {
      i++;
      continue;
    }

    // 2. Headings: #, ##, ###, ####
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      blocks.push({
        type: 'heading',
        level,
        text: headingMatch[2].trim()
      });
      i++;
      continue;
    }

    // 3. Tables: lines starting with | or containing multiple |
    if (trimmed.startsWith('|') && trimmed.includes('|', 1)) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        const parseRow = (rowLine) => {
          const cells = rowLine.split('|');
          // Drop outer empty elements from leading/trailing pipe
          if (cells.length > 2) {
            return cells.slice(1, -1).map(c => c.trim());
          }
          return cells.map(c => c.trim()).filter(Boolean);
        };

        const headerCells = parseRow(tableLines[0]);
        const isDelimiter = /^\|?[\s-:]+(\|[\s-:]+)+\|?$/.test(tableLines[1]);
        const dataRows = [];
        const startIndex = isDelimiter ? 2 : 1;
        for (let r = startIndex; r < tableLines.length; r++) {
          const cells = parseRow(tableLines[r]);
          if (cells.length > 0) dataRows.push(cells);
        }

        blocks.push({
          type: 'table',
          headers: headerCells,
          rows: dataRows
        });
        continue;
      } else {
        blocks.push({ type: 'paragraph', text: tableLines[0] });
        continue;
      }
    }

    // 4. Blockquotes: > quote
    if (trimmed.startsWith('>')) {
      const quoteLines = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      blocks.push({
        type: 'blockquote',
        text: quoteLines.join(' ')
      });
      continue;
    }

    // 5. Unordered lists: - item, * item, • item
    if (/^[-*•]\s+/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^[-*•]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*•]\s+/, ''));
        i++;
      }
      blocks.push({
        type: 'unordered_list',
        items
      });
      continue;
    }

    // 6. Ordered lists: 1. item, 2. item
    if (/^\d+\.\s+/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i++;
      }
      blocks.push({
        type: 'ordered_list',
        items
      });
      continue;
    }

    // 7. Regular paragraph
    const paraLines = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().match(/^#{1,6}\s+/) &&
      !lines[i].trim().startsWith('|') &&
      !lines[i].trim().startsWith('>') &&
      !/^[-*•]\s+/.test(lines[i].trim()) &&
      !/^\d+\.\s+/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push({
        type: 'paragraph',
        text: paraLines.join(' ')
      });
    }
  }

  return blocks;
}

/**
 * CareerAnswerRenderer Component
 * Renders LLM output cleanly into structured, student-friendly visual elements.
 */
export default function CareerAnswerRenderer({ content }) {
  if (typeof content !== 'string' || !content.trim()) return null;

  const blocks = parseMarkdownBlocks(content);

  return (
    <div className="advisor-answer-text">
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          if (block.level <= 2) {
            return (
              <h3 key={index} className="advisor-answer-heading-primary">
                {renderInline(block.text)}
              </h3>
            );
          }
          return (
            <h4 key={index} className="advisor-answer-heading-secondary">
              {renderInline(block.text)}
            </h4>
          );
        }

        if (block.type === 'table') {
          return (
            <div key={index} className="advisor-table-wrap">
              <table className="advisor-table">
                {block.headers.length > 0 && (
                  <thead>
                    <tr>
                      {block.headers.map((h, hi) => (
                        <th key={hi}>{renderInline(h)}</th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {block.rows.map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => (
                        <td key={ci}>{renderInline(cell)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (block.type === 'unordered_list') {
          return (
            <ul key={index} className="advisor-answer-list">
              {block.items.map((item, itemIdx) => (
                <li key={itemIdx}>{renderInline(item)}</li>
              ))}
            </ul>
          );
        }

        if (block.type === 'ordered_list') {
          return (
            <ol key={index} className="advisor-answer-list-ordered">
              {block.items.map((item, itemIdx) => (
                <li key={itemIdx}>{renderInline(item)}</li>
              ))}
            </ol>
          );
        }

        if (block.type === 'blockquote') {
          return (
            <blockquote key={index} className="advisor-answer-quote">
              {renderInline(block.text)}
            </blockquote>
          );
        }

        // Default: Paragraph
        return (
          <p key={index} className="advisor-answer-paragraph">
            {renderInline(block.text)}
          </p>
        );
      })}
    </div>
  );
}

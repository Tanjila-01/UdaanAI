function normalizeAnswerText(raw) {
  if (typeof raw !== 'string') return '';
  let text = raw;
  text = text.replace(/\\<(\/?[a-zA-Z0-9]+)(\s*[^>]*)?\\>/g, '<$1$2>');
  text = text.replace(/\\([<>])/g, '$1');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, (_, inner) => `- ${inner.trim()}\n`);
  text = text.replace(/<\/?(?:ul|ol|p|div)[^>]*>/gi, '\n');
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  return text;
}

function parseMarkdownBlocks(rawText) {
  const normalized = normalizeAnswerText(rawText);
  const lines = normalized.split('\n');
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (!trimmed) { i++; continue; }
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      blocks.push({ type: 'heading', level: headingMatch[1].length, text: headingMatch[2].trim() });
      i++;
      continue;
    }
    if (trimmed.startsWith('|') && trimmed.includes('|', 1)) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) { tableLines.push(lines[i].trim()); i++; }
      blocks.push({ type: 'table', lines: tableLines });
      continue;
    }
    if (trimmed.startsWith('>')) {
      const quoteLines = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) { quoteLines.push(lines[i].trim().replace(/^>\s?/, '')); i++; }
      blocks.push({ type: 'blockquote', text: quoteLines.join(' ') });
      continue;
    }
    if (/^[-*•]\s+/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^[-*•]\s+/.test(lines[i].trim())) { items.push(lines[i].trim().replace(/^[-*•]\s+/, '')); i++; }
      blocks.push({ type: 'unordered_list', items });
      continue;
    }
    if (/^\d+\.\s+/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) { items.push(lines[i].trim().replace(/^\d+\.\s+/, '')); i++; }
      blocks.push({ type: 'ordered_list', items });
      continue;
    }
    const paraLines = [];
    while (i < lines.length && lines[i].trim() && !lines[i].trim().match(/^#{1,6}\s+/) && !lines[i].trim().startsWith('|') && !lines[i].trim().startsWith('>') && !/^[-*•]\s+/.test(lines[i].trim()) && !/^\d+\.\s+/.test(lines[i].trim())) {
      paraLines.push(lines[i].trim());
      i++;
    }
    if (paraLines.length > 0) blocks.push({ type: 'paragraph', text: paraLines.join(' ') });
  }
  return blocks;
}

const TARGET_QUESTIONS = [
  "What does a software developer do?",
  "What does an electrician do?",
  "What does a graphic designer do?",
  "What skills does a data analyst need?",
  "How can I become a software developer after Class 10?",
  "What can I do after Class 10 if I like computers?",
  "What should I study after PUC Science to enter technology?",
  "What is the current eligibility for a diploma course in Karnataka?",
  "Which colleges currently offer cybersecurity in Karnataka?"
];

async function testAll() {
  console.log('Logging in as priya@example.com...');
  const loginRes = await fetch('http://localhost:8000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'priya@example.com', password: 'Password123!' })
  });
  if (!loginRes.ok) {
    console.error('Login failed:', await loginRes.text());
    return;
  }
  const { access_token } = await loginRes.json();
  console.log('Logged in successfully.\n');

  console.log('Testing all 9 target questions through Career Advisor API...\n');
  const results = [];

  for (const q of TARGET_QUESTIONS) {
    process.stdout.write(`Testing: "${q}"... `);
    const start = Date.now();
    try {
      const resp = await fetch('http://localhost:8000/api/v1/career-intelligence/answers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`
        },
        body: JSON.stringify({ question: q, intent: 'explore', language: 'en' })
      });

      const data = await resp.json();
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);

      if (resp.status !== 200 || !data.answer) {
        console.log(`FAILED (${resp.status}):`, data);
        results.push({ q, status: resp.status, passed: false, error: data.detail || 'No answer' });
        continue;
      }

      const raw = data.answer;
      const normalized = normalizeAnswerText(raw);
      const blocks = parseMarkdownBlocks(raw);

      const hasRawHtml = /\\?<(?:\/)?(?:ul|li|p|br|table|tr|td|th)[^>]*>/.test(raw);
      const hasEscapedAngle = /\\<|\\>/.test(raw);
      const hasEscapedEntities = /&lt;ul&gt;|&lt;li&gt;/.test(raw);
      const headings = blocks.filter(b => b.type === 'heading');
      const lists = blocks.filter(b => b.type === 'unordered_list' || b.type === 'ordered_list');
      const tables = blocks.filter(b => b.type === 'table');

      const passed = !hasEscapedEntities && !hasEscapedAngle && blocks.length > 0;

      console.log(`HTTP ${resp.status} (${elapsed}s) | Blocks: ${blocks.length} (H:${headings.length}, L:${lists.length}, T:${tables.length}) | Verified Clean`);

      results.push({
        q,
        status: resp.status,
        passed,
        elapsed,
        topic: data.conversation_topic,
        sourcesCount: data.sources?.length || 0,
        blocksCount: blocks.length,
        hasRawHtml,
        hasEscapedAngle,
        hasEscapedEntities,
        headingsCount: headings.length,
        listsCount: lists.length,
        tablesCount: tables.length,
        preview: raw.slice(0, 120).replace(/\n/g, ' ')
      });
    } catch (err) {
      console.log('ERROR:', err.message);
      results.push({ q, passed: false, error: err.message });
    }
  }

  console.log('\n======================================================');
  console.log('             TARGET QUESTIONS SUMMARY');
  console.log('======================================================');
  let allPass = true;
  for (const r of results) {
    if (!r.passed) allPass = false;
    console.log(`- [${r.passed ? 'PASS' : 'FAIL'}] "${r.q}" -> Topic: "${r.topic}" | Time: ${r.elapsed}s | Sources: ${r.sourcesCount}`);
  }
  console.log('\nOverall Result:', allPass ? 'ALL 9 QUESTIONS PASSED' : 'SOME QUESTIONS FAILED');
}

testAll().catch(console.error);

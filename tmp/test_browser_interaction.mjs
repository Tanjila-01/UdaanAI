import fs from 'node:fs';

async function main() {
  const tabs = await (await fetch('http://localhost:9222/json')).json();
  const pageTab = tabs.find(t => t.url.includes('ai-career'));
  if (!pageTab) {
    console.error('Could not find ai-career page tab');
    process.exit(1);
  }

  console.log('Connecting to', pageTab.webSocketDebuggerUrl);
  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);

  let id = 0;
  const callbacks = new Map();

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && callbacks.has(data.id)) {
      callbacks.get(data.id)(data);
      callbacks.delete(data.id);
    }
  };

  const send = (method, params = {}) => new Promise((resolve) => {
    const msgId = ++id;
    callbacks.set(msgId, resolve);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });

  await new Promise(r => ws.onopen = r);
  console.log('Connected to CDP');

  await send('Page.enable');
  await send('Runtime.enable');

  const evalJs = async (expr) => {
    const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    return res.result?.result?.value;
  };

  console.log('Page title:', await evalJs('document.title'));

  // 1. Submit Question: "What does a software developer do?"
  console.log('Filling question...');
  await evalJs(`(() => {
    const textarea = document.getElementById('career-question');
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    nativeSetter.call(textarea, 'What does a software developer do?');
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);

  console.log('Submitting question via form.requestSubmit()...');
  await evalJs(`(() => {
    const form = document.querySelector('form.advisor-composer');
    if (form) form.requestSubmit();
    else {
      const btn = document.querySelector('.advisor-send');
      if (btn) btn.click();
    }
  })()`);

  // 2. Poll for answer
  console.log('Waiting for answer to generate and render...');
  let answerHtml = '';
  for (let i = 0; i < 45; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const status = await evalJs(`(() => {
      const el = document.querySelector('.advisor-answer-text');
      const error = document.querySelector('.advisor-error');
      if (error) return { done: true, error: error.textContent };
      if (el) return { done: true, text: el.innerText, html: el.innerHTML };
      return { done: false };
    })()`);

    if (status?.done) {
      if (status.error) {
        console.error('Answer error:', status.error);
        break;
      }
      console.log('\nAnswer rendered successfully in DOM!');
      answerHtml = status.html;
      break;
    }
    process.stdout.write('.');
  }

  // 3. Inspect elements
  const inspection = await evalJs(`(() => {
    const el = document.querySelector('.advisor-answer-text');
    if (!el) return null;
    return {
      hasRawHtmlEscaped: el.innerHTML.includes('&lt;ul&gt;') || el.innerHTML.includes('&lt;li&gt;') || el.innerText.includes('<ul>') || el.innerText.includes('<li>'),
      headings: Array.from(el.querySelectorAll('h3, h4')).map(h => h.textContent),
      bulletItems: Array.from(el.querySelectorAll('.advisor-answer-list li')).map(li => li.textContent),
      tables: Array.from(el.querySelectorAll('table')).length,
      paragraphs: Array.from(el.querySelectorAll('.advisor-answer-paragraph')).map(p => p.textContent),
      suggestedChips: Array.from(document.querySelectorAll('.advisor-suggested-chip')).map(c => c.textContent),
      savedBadge: document.querySelector('.advisor-saved-caption')?.textContent
    };
  })()`);

  console.log('\n========================================');
  console.log('      DOM INSPECTION REPORT');
  console.log('========================================');
  console.log('Has raw/escaped HTML tags:', inspection?.hasRawHtmlEscaped);
  console.log('Headings found (' + inspection?.headings?.length + '):', inspection?.headings);
  console.log('Number of bullet items:', inspection?.bulletItems?.length);
  if (inspection?.bulletItems?.length > 0) {
    console.log('Sample bullets:', inspection.bulletItems.slice(0, 3));
  }
  console.log('Tables found:', inspection?.tables);
  console.log('Suggested Follow-up Chips (' + inspection?.suggestedChips?.length + '):', inspection?.suggestedChips);
  console.log('Saved Badge text:', inspection?.savedBadge);

  // 4. Test clicking an interactive follow-up chip
  if (inspection?.suggestedChips?.length > 0) {
    const firstChip = inspection.suggestedChips[0];
    console.log('\n--- CLICKING SUGGESTED CHIP: "' + firstChip + '" ---');
    await evalJs(`(() => {
      const chips = Array.from(document.querySelectorAll('.advisor-suggested-chip'));
      if (chips[0]) chips[0].click();
    })()`);

    console.log('Waiting for follow-up answer in second exchange...');
    for (let i = 0; i < 45; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const exchangeCount = await evalJs(`document.querySelectorAll('.advisor-exchange').length`);
      const secondAnswer = await evalJs(`(() => {
        const exchanges = document.querySelectorAll('.advisor-exchange');
        if (exchanges.length < 2) return null;
        const second = exchanges[1];
        const ans = second.querySelector('.advisor-answer-text');
        const err = second.querySelector('.advisor-error');
        if (err) return { done: true, err: err.textContent };
        if (ans) return { done: true, text: ans.innerText, headings: Array.from(ans.querySelectorAll('h3, h4')).map(h => h.textContent) };
        return { done: false };
      })()`);

      if (secondAnswer?.done) {
        console.log('\nFollow-up answer completed!');
        console.log('Total exchanges now rendered:', exchangeCount);
        console.log('Follow-up headings:', secondAnswer.headings);
        console.log('Follow-up text preview:', secondAnswer.text?.slice(0, 150) + '...');
        break;
      }
      process.stdout.write('.');
    }
  }

  // 5. Take screenshot
  const shotRes = await send('Page.captureScreenshot', { format: 'png' });
  if (shotRes.result?.data) {
    fs.writeFileSync('tmp/advisor_verified.png', Buffer.from(shotRes.result.data, 'base64'));
    console.log('\nSaved verification screenshot to tmp/advisor_verified.png');
  }

  ws.close();
}

main().catch(console.error);

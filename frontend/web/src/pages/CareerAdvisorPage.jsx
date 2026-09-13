import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Send, Sparkles } from 'lucide-react';
import { getCareerAnswerApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import EditProfileDrawer from '../components/EditProfileDrawer';

const examples = ['What does a software developer do?', 'What does a graphic designer do?', 'What does an electrician do?'];
const statuses = new Set(['answered', 'recommendations_explained', 'insufficient_evidence', 'needs_update', 'out_of_scope', 'unavailable']);
const buttonStyle = 'rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed';

function sourceUrl(value) {
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : null; }
  catch { return null; }
}

function Answer({ result }) {
  return <div className="space-y-4">
    <p className="whitespace-pre-wrap leading-relaxed">{result.answer}</p>
    {result.recommendations?.length > 0 && <div className="space-y-3">
      <p className="text-sm text-slate-500">Match scores describe your saved assessment fit, not a guarantee of success.</p>
      {result.recommendations.map(item => <section key={item.pathway_id} className="rounded-xl border border-slate-200 p-4">
        <h3 className="font-bold">{item.rank}. {item.title}</h3>
        <p className="text-sm text-teal-800">{item.match_label} · Match score: {item.match_score}</p>
        <p className="mt-2">{item.explanation}</p>
      </section>)}
    </div>}
    {result.status === 'needs_update' && <div className="flex flex-wrap gap-4 text-sm font-semibold text-teal-800 underline">
      <Link to="/onboarding">Update profile</Link><Link to="/assessment">Take assessment</Link><Link to="/dashboard">Refresh recommendations</Link>
    </div>}
    {result.sources?.length > 0 && <section aria-label="Sources" className="border-t border-slate-200 pt-4 text-sm space-y-3">
      <h3 className="font-bold">Sources</h3>
      {result.sources.map(source => <div key={`${source.reference}-${source.chunk_id}`} className="space-y-1 break-words">
        <p className="font-semibold">[{source.reference}] {source.title}{source.heading ? ` — ${source.heading}` : ''}</p>
        <p className="text-slate-500">{source.scope}{source.reviewed_on ? ` · Reviewed ${source.reviewed_on}` : ''}</p>
        {source.references?.map((reference, index) => {
          const url = sourceUrl(reference.url);
          return url ? <a key={index} className="block text-teal-800 underline" href={url} target="_blank" rel="noopener noreferrer">{reference.publisher || 'Read source'}{reference.jurisdiction ? ` (${reference.jurisdiction})` : ''} ↗</a> : null;
        })}
      </div>)}
    </section>}
  </div>;
}

function AdvisorSession() {
  const { isCollapsed } = useSidebar();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [exchanges, setExchanges] = useState([]);
  const [busy, setBusy] = useState(false);
  const pending = useRef(null);
  const nextId = useRef(0);
  useEffect(() => () => { pending.current?.abort(); pending.current = null; }, []);

  async function ask(payload, retryId) {
    if (pending.current) return;
    const controller = new AbortController();
    pending.current = controller;
    const id = retryId ?? ++nextId.current;
    setBusy(true);
    const entry = { id, payload, loading: true };
    setExchanges(old => retryId ? old.map(item => item.id === id ? entry : item) : [...old, entry]);
    if (!retryId) setQuestion('');
    try {
      const result = await getCareerAnswerApi(payload, { signal: controller.signal });
      if (!statuses.has(result?.status) || typeof result.answer !== 'string' || !Array.isArray(result.sources) || !Array.isArray(result.recommendations)) throw new Error('Invalid answer');
      if (!controller.signal.aborted) setExchanges(old => old.map(item => item.id === id ? { ...entry, loading: false, result, retryable: result.status === 'unavailable' } : item));
    } catch (error) {
      if (controller.signal.aborted) return;
      const status = error.response?.status;
      const message = status === 429 ? 'The local AI is busy. Please wait a little, then retry.'
        : status === 401 || status === 403 ? 'Your session could not be verified. Please sign in again.'
        : status === 422 ? 'This question could not be accepted. Please try a different question.'
        : 'The advisor could not respond. Check that your local services are running, then retry.';
      setExchanges(old => old.map(item => item.id === id ? { ...entry, loading: false, error: message, retryable: ![401, 403, 422].includes(status), signIn: [401, 403].includes(status) } : item));
    } finally {
      if (pending.current === controller) { pending.current = null; setBusy(false); }
    }
  }
  const explore = text => ask({ question: text.trim(), intent: 'explore', language: 'en' });

  return <div className="min-h-screen bg-[#F8FAF8] text-slate-900 flex">
    <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    <div className={`flex-1 min-w-0 ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
      <Header onMenuClick={() => setSidebarOpen(true)} onEditProfileClick={() => setDrawerOpen(true)} />
      <main className="max-w-5xl mx-auto p-4 sm:p-8 space-y-6">
        <header className="space-y-3">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-teal-800"><Sparkles size={18} /> English · Early access</span>
          <h1 className="text-3xl font-bold">AI Career Advisor</h1>
          <p className="text-slate-600">Explore career duties with sources, or understand your saved recommendations.</p>
          <p className="text-sm text-slate-500">Each question is independent. These messages are only kept while this page is open.</p>
        </header>
        <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4" aria-label="Start exploring">
          <h2 className="font-bold flex items-center gap-2"><MessageCircle size={20} /> What would you like to explore?</h2>
          <div className="flex flex-wrap gap-2">{examples.map(text => <button key={text} className={buttonStyle} disabled={busy} onClick={() => explore(text)}>{text}</button>)}</div>
          <p className="text-sm text-slate-500">Verified career-duty information currently covers software development, graphic design and electrician work. Admission guidance is still being verified.</p>
          <button className={buttonStyle} disabled={busy} onClick={() => ask({ question: 'Explain my saved career recommendations.', intent: 'explain_recommendations', language: 'en' })}>Explain my recommendations</button>
        </section>
        <div className="space-y-5" role="log" aria-label="Advisor messages" aria-live="polite" aria-relevant="additions text">
          {exchanges.map(entry => <article key={entry.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-teal-50 p-5"><p className="text-xs font-bold text-teal-800 mb-1">YOU</p><p className="whitespace-pre-wrap break-words">{entry.payload.question}</p></div>
            <div className="p-5 space-y-3"><p className="text-xs font-bold text-teal-800">UDAAN</p>
              {entry.loading && <p role="status" className="text-slate-500">Preparing your answer… Local AI may take a minute or more.</p>}
              {entry.result && <Answer result={entry.result} />}
              {entry.error && <p role="alert">{entry.error}</p>}
              {entry.retryable && <button className={buttonStyle} disabled={busy} onClick={() => ask(entry.payload, entry.id)}>Retry answer</button>}
              {entry.signIn && <Link to="/login" className="underline text-teal-800">Sign in</Link>}
            </div>
          </article>)}
        </div>
        <form className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3" onSubmit={event => { event.preventDefault(); if (question.trim() && question.trim().length <= 1000) explore(question); }}>
          <label htmlFor="career-question" className="block font-semibold">Ask a career question</label>
          <textarea id="career-question" rows={3} maxLength={1000} value={question} onChange={event => setQuestion(event.target.value)} placeholder="What does a software developer do?" className="w-full rounded-xl border border-slate-300 p-3 focus:outline-teal-700" aria-describedby="question-limit" />
          <div className="flex items-center justify-between gap-3"><span id="question-limit" className="text-xs text-slate-500">{question.length}/1000 characters</span><button type="submit" disabled={busy || !question.trim()} className="flex items-center gap-2 bg-teal-800 text-white rounded-xl px-5 py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"><Send size={16} /> Ask Udaan</button></div>
        </form>
      </main>
    </div>
    <EditProfileDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
  </div>;
}

export default function CareerAdvisorPage() {
  const { user } = useAuth();
  return <AdvisorSession key={user?.id || 'anonymous'} />;
}

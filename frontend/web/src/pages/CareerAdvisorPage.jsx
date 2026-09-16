import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowUp, ArrowUpRight, AudioLines, BookOpen, Check, Code2, Compass, Lightbulb, Loader2, Mic, Palette, Plus, ShieldCheck, Sparkles, Square, Volume2, Wrench, X } from 'lucide-react';
import { getCareerAnswerApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { useLocalReadAloud, useLocalVoiceInput } from '../hooks/useAdvisorVoice';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import EditProfileDrawer from '../components/EditProfileDrawer';
import '../styles/career-advisor.css';
import AdvisorHistory from '../components/AdvisorHistory';

const examples = [
  { title: 'Build with technology', label: 'Software development', question: 'What does a software developer do?', icon: Code2, color: 'mint' },
  { title: 'Bring ideas to life', label: 'Graphic design', question: 'What does a graphic designer do?', icon: Palette, color: 'peach' },
  { title: 'Make things work', label: 'Electrician work', question: 'What does an electrician do?', icon: Wrench, color: 'lavender' },
];
const statuses = new Set(['answered', 'recommendations_explained', 'insufficient_evidence', 'needs_update', 'out_of_scope', 'unavailable', 'needs_clarification']);

function sourceUrl(value) {
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : null; }
  catch { return null; }
}

function renderFormattedAnswer(text) {
  if (typeof text !== 'string') return null;
  const parts = text.split(/(\*\*\*[^*]+?\*\*\*|\*\*[^*]+?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('***') && part.endsWith('***') && part.length >= 6) {
      return <strong key={index}><em>{part.slice(3, -3)}</em></strong>;
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function Answer({ result }) {
  return <div className="advisor-answer">
    {result.answer_origin === 'web' && Array.isArray(result.sources) && result.sources.length > 0 && <p className="advisor-caption">Sources checked online{result.checked_at ? ` · Checked ${new Date(result.checked_at).toLocaleString()}` : ''}.</p>}
    <p className="advisor-answer-text">{renderFormattedAnswer(result.answer)}</p>
    {result.recommendations.length > 0 && <div className="advisor-recommendations">
      <p className="advisor-caption">Match scores describe your saved assessment fit, not a guarantee of success.</p>
      {result.recommendations.map(item => <section key={item.pathway_id} className="advisor-match">
        <h3>{item.rank}. {item.title}</h3>
        <span className="advisor-match-label">{item.match_label} · Match score: {item.match_score}</span>
        <p>{renderFormattedAnswer(item.explanation)}</p>
      </section>)}
    </div>}
    {result.status === 'recommendations_explained' && <div className="advisor-setup-links"><Link to="/pathways">Explore my pathways <ArrowUpRight size={14} /></Link><Link to="/my-roadmap">My roadmap <ArrowUpRight size={14} /></Link></div>}
    {result.status === 'needs_update' && <div className="advisor-setup-links">
      <Link to="/onboarding">Update profile <ArrowUpRight size={14} /></Link>
      <Link to="/assessment">Take assessment <ArrowUpRight size={14} /></Link>
      <Link to="/dashboard">Refresh recommendations <ArrowUpRight size={14} /></Link>
    </div>}
    {result.sources.length > 0 && <details className="advisor-sources">
      <summary><BookOpen size={16} /> View sources <span>{result.sources.length}</span></summary>
      <section aria-label="Sources">
        {result.sources.map(source => <div key={`${source.reference}-${source.chunk_id}`} className="advisor-source">
          <h3>[{source.reference}] {source.title}</h3>
          {source.heading && <p>{source.heading}</p>}
          <p className="advisor-caption">{source.scope}{source.reviewed_on ? ` · Reviewed ${source.reviewed_on}` : ''}</p>
          {source.references?.map((reference, index) => {
            const url = sourceUrl(reference.url);
            return url ? <a key={index} href={url} target="_blank" rel="noopener noreferrer">{reference.publisher || 'Read source'}{reference.jurisdiction ? ` (${reference.jurisdiction})` : ''} <ArrowUpRight size={14} /></a> : null;
          })}
        </div>)}
      </section>
    </details>}
  </div>;
}

function AdvisorSession() {
  const location = useLocation();
  const navigate = useNavigate();
  const explainRequested = new URLSearchParams(location.search).get('intent') === 'explain_recommendations';
  const { isCollapsed } = useSidebar();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [exchanges, setExchanges] = useState([]);
  const [busy, setBusy] = useState(false);
  const [historyBusy, setHistoryBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [followUp, setFollowUp] = useState(null);
  const pending = useRef(null);
  const nextId = useRef(0);
  const bottom = useRef(null);
  const input = useRef(null);
  const readAloud = useLocalReadAloud();
  const voice = useLocalVoiceInput(text => {
    const combined = `${question.trim()} ${text}`.trim();
    if (combined.length > 1000) {
      setNotice('Your question is too long to add the recording. Shorten it, then record again.');
    } else {
      setQuestion(combined);
      setNotice('Voice added. Check your question, then send it when you are ready.');
    }
  });
  const voiceBusy = voice.phase !== 'idle';
  const locked = busy || voiceBusy || historyBusy;
  useEffect(() => () => { pending.current?.abort(); pending.current = null; }, []);
  useEffect(() => { if (exchanges.length) bottom.current?.scrollIntoView?.({ block: 'nearest', behavior: 'auto' }); }, [exchanges]);
  useEffect(() => { if (voice.phase === 'idle' && notice.startsWith('Voice added.')) input.current?.focus(); }, [voice.phase, notice]);

  const cancelQuestion = id => {
    if (pending.current) {
      pending.current.abort();
      pending.current = null;
    }
    setBusy(false);
    setExchanges(old => old.filter(item => item.id !== id));
  };

  async function ask(payload, retryId) {
    if (pending.current || voiceBusy || historyBusy) return;
    readAloud.stop(); setNotice('');
    const controller = new AbortController();
    pending.current = controller;
    const id = retryId ?? ++nextId.current;
    setBusy(true);
    const entry = { id, payload, loading: true, loadingStage: 'checking' };
    setExchanges(old => retryId ? old.map(item => item.id === id ? entry : item) : [...old, entry]);
    if (!retryId) { setQuestion(''); setFollowUp(null); }
    const stageTimer = setTimeout(() => {
      setExchanges(old => old.map(item => item.id === id && item.loading ? { ...item, loadingStage: 'preparing' } : item));
    }, 2800);
    try {
      const result = await getCareerAnswerApi(payload, { signal: controller.signal });
      if (!statuses.has(result?.status) || typeof result.answer !== 'string' || !Array.isArray(result.sources) || !Array.isArray(result.recommendations)) throw new Error('Invalid answer');
      if (!controller.signal.aborted) setExchanges(old => old.map(item => item.id === id ? { ...entry, loading: false, result, retryable: result.status === 'unavailable' } : item));
    } catch (error) {
      if (controller.signal.aborted) return;
      const status = error.response?.status;
      const message = status === 429 ? 'The local AI is busy. Please wait a little, then retry.'
        : status === 401 || status === 403 ? 'Your session could not be verified. Please sign in again.'
        : status === 404 ? 'The selected answer is no longer available. Name the career in a new question.'
        : status === 422 ? 'This question could not be accepted. Please try a different question.'
        : 'The advisor could not respond. Check that your local services are running, then retry.';
      setExchanges(old => old.map(item => item.id === id ? { ...entry, loading: false, error: message, retryable: ![401, 403, 404, 422].includes(status), signIn: [401, 403].includes(status) } : item));
    } finally {
      clearTimeout(stageTimer);
      if (pending.current === controller) { pending.current = null; setBusy(false); }
    }
  }
  const explore = text => ask({ question: text.trim(), intent: 'explore', language: 'en' });
  const submitQuestion = text => ask({ question: text.trim(), intent: 'explore', language: 'en', ...(followUp ? { follow_up_to: followUp.id } : {}) });
  const handleKeyDown = event => {
    if (event.key === 'Enter' && !event.shiftKey) {
      if (event.isComposing || event.keyCode === 229) return;
      event.preventDefault();
      if (!locked && question.trim() && question.trim().length <= 1000) {
        submitQuestion(question);
      }
    }
  };
  const chooseFollowUp = entry => {
    readAloud.stop(); setNotice('');
    setFollowUp({ id: entry.result.history_id || entry.historyId, label: entry.result.conversation_topic || entry.result.sources[0]?.title || entry.payload.question });
    input.current?.focus();
  };
  const refreshSaved = entry => ask({ ...entry.payload, answer_mode: 'auto', refresh: true, ...(entry.payload.follow_up_to ? { follow_up_to: entry.historyId } : {}) });
  const explain = () => ask({ question: 'Explain my saved career recommendations.', intent: 'explain_recommendations', language: 'en' });
  // Defer until mounted so StrictMode's first cleanup cannot abort a duplicate request.
  // Consume the navigation intent so Start fresh does not trigger another explanation.
  useEffect(() => {
    if (!explainRequested) return;
    const timer = setTimeout(() => {
      explain();
      const params = new URLSearchParams(location.search);
      params.delete('intent');
      navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
    }, 0);
    return () => clearTimeout(timer);
  }, [explainRequested, navigate]);
  const openSaved = saved => {
    if (!saved?.request?.question || !statuses.has(saved.response?.status) || typeof saved.response.answer !== 'string' || !Array.isArray(saved.response.sources) || !Array.isArray(saved.response.recommendations)) throw new Error('Invalid saved answer');
    readAloud.stop();
    setExchanges(old => [...old.filter(item => item.id !== `saved-${saved.id}`), { id: `saved-${saved.id}`, historyId: saved.id, payload: saved.request, result: saved.response, savedAt: saved.created_at }]);
  };
  const clear = () => { readAloud.stop(); setExchanges([]); setQuestion(''); setFollowUp(null); setNotice('A fresh start. What would you like to explore?'); input.current?.focus(); };

  return <div className="advisor-page min-h-screen flex">
    <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    <div className={`flex-1 min-w-0 ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
      <Header onMenuClick={() => setSidebarOpen(true)} onEditProfileClick={() => setDrawerOpen(true)} />
      <main className="advisor-main">
        <header className="advisor-page-heading">
          <div><p className="advisor-eyebrow"><Compass size={15} /> YOUR NEXT CHAPTER</p><h1>AI Career Advisor</h1><p>A little curiosity. A clearer direction.</p></div>
          <span className="advisor-language">English</span>
        </header>
        <div className="advisor-layout">
          <section className="advisor-workspace" aria-label="Career conversation">
            <div className="advisor-conversation-bar"><span><span className="advisor-avatar"><Sparkles size={17} /></span><strong>Udaan</strong><span className="advisor-caption">Your career companion</span></span><button className="advisor-icon-button" type="button" disabled={locked || exchanges.length === 0} onClick={clear} aria-label="Start fresh" title="Start fresh"><Plus size={19} /></button></div>
            <div className="advisor-scroll">
              {exchanges.length === 0 && <section className="advisor-welcome" aria-label="Start exploring">
                <div className="advisor-orbit" aria-hidden="true"><Compass size={33} /><span className="advisor-orbit-star"><Sparkles size={16} /></span></div>
                <h2>Where could your curiosity take you?</h2>
                <p>You don't need it all figured out.<br />Start with one career you'd like to understand.</p>
                <div className="advisor-starters">{examples.map(({ title, label, question: text, icon: Icon, color }) => <button key={text} className={`advisor-starter ${color}`} disabled={locked} onClick={() => explore(text)} aria-label={text}><span className="advisor-starter-icon"><Icon size={21} /></span><strong>{title}</strong><span>{label}<ArrowUpRight size={15} /></span></button>)}</div>
                <button className="advisor-personal-link" disabled={locked} onClick={explain}><Sparkles size={15} /> Explain my recommendations <ArrowUpRight size={15} /></button>
              </section>}
              <div className="advisor-messages" role="log" aria-label="Advisor messages" aria-live="polite" aria-relevant="additions text">
                {exchanges.map(entry => <article key={entry.id} className="advisor-exchange">
                  <div className="advisor-question"><span className="advisor-caption">You</span><p>{entry.payload.question}</p></div>
                  <div className="advisor-reply"><span className="advisor-avatar"><Sparkles size={17} /></span><div className="advisor-reply-body"><div className="advisor-reply-label"><strong>Udaan</strong>{entry.result?.sources.length > 0 && <span><ShieldCheck size={13} /> With sources</span>}</div>
                    {entry.savedAt && <div className="advisor-snapshot"><p>Saved {new Date(entry.savedAt).toLocaleDateString()}. This is a saved answer. Refresh to check the latest information.</p><button type="button" className="advisor-secondary" disabled={locked} onClick={() => refreshSaved(entry)}>Refresh answer</button></div>}
                    {!entry.savedAt && entry.result?.history_id && <p className="advisor-caption">Saved to Previous questions</p>}
                    {!entry.savedAt && entry.result && ['answered', 'recommendations_explained'].includes(entry.result.status) && entry.result.history_id === null && <p className="advisor-caption">This answer could not be saved. It is available on this page only.</p>}
                    {entry.loading && <div className="advisor-loading-row">
                      <p role="status" className="advisor-loading">
                        <Loader2 size={17} className="advisor-spin" />
                        {entry.loadingStage === 'preparing'
                          ? 'Researching your question… Preparing your answer…'
                          : 'Researching your question… Checking reliable sources…'}
                      </p>
                      <button type="button" className="advisor-cancel-inline" onClick={() => cancelQuestion(entry.id)} aria-label="Cancel question" title="Cancel question">
                        <X size={13} /> Cancel
                      </button>
                    </div>}
                    {entry.result && <><Answer result={entry.result} /><button className="advisor-listen" disabled={voiceBusy || !readAloud.available} title={readAloud.available ? 'Read this answer aloud using an on-device voice' : 'No on-device English voice is available in this browser'} onClick={() => readAloud.speak(entry.id, [entry.result.answer.replace(/\*\*/g, ''), ...entry.result.recommendations.map(item => `${item.title}. ${item.explanation.replace(/\*\*/g, '')}`)].join(' '))}>{readAloud.speakingId === entry.id ? <Square size={14} /> : <Volume2 size={15} />}{readAloud.speakingId === entry.id ? 'Stop listening' : 'Listen'}</button></>}
                    {entry.result?.status === 'answered' && entry.payload.intent === 'explore' && (entry.result.history_id || entry.historyId) && <button type="button" className="advisor-followup-button" disabled={locked} onClick={() => chooseFollowUp(entry)}>Ask a follow-up</button>}
                    {entry.result?.conversation_topic && <p className="advisor-caption">About: {entry.result.conversation_topic}</p>}
                    {entry.error && <p role="alert" className="advisor-error">{entry.error}</p>}
                    {entry.retryable && <button className="advisor-secondary" disabled={locked} onClick={() => ask(entry.payload, entry.id)}>Retry answer</button>}
                    {entry.signIn && <Link to="/login">Sign in</Link>}
                  </div></div>
                </article>)}
              </div>
              <div ref={bottom} />
            </div>
            <form className="advisor-composer" onSubmit={event => { event.preventDefault(); if (question.trim() && question.trim().length <= 1000) submitQuestion(question); }}>
              {followUp && <div className="advisor-context-chip"><span>Following up on: <strong>{followUp.label}</strong></span><button type="button" className="advisor-icon-button" disabled={locked} aria-label="Clear follow-up context" onClick={() => setFollowUp(null)}><X size={15} /></button></div>}
              <label htmlFor="career-question">Ask a career question</label>
              <div className="advisor-input-box"><textarea ref={input} id="career-question" rows={2} maxLength={1000} disabled={voiceBusy} value={question} onChange={event => setQuestion(event.target.value)} onKeyDown={handleKeyDown} placeholder="What are you curious about?" aria-describedby="question-limit voice-description search-description" />
                <div className="advisor-composer-actions"><div className="advisor-voice-actions">
                  {voice.phase === 'idle' ? <button type="button" className="advisor-voice-button" disabled={busy || historyBusy || !voice.supported} onClick={() => { readAloud.stop(); setNotice(''); voice.start(); }}><Mic size={17} /> Speak</button>
                    : <><span className="advisor-recording" role="status">{voice.phase === 'recording' ? <><span />{voice.seconds}s / 30s</> : <><Loader2 size={15} className="advisor-spin" />{voice.phase === 'starting' ? 'Allow microphone…' : 'Turning speech into text…'}</>}</span>{voice.phase === 'recording' && <button type="button" className="advisor-voice-button" onClick={voice.finish}><Square size={14} /> Done</button>}<button type="button" className="advisor-icon-button" aria-label="Cancel voice input" onClick={voice.cancel}><X size={16} /></button></>}
                </div><button type="submit" disabled={locked || !question.trim()} className="advisor-send" aria-label="Ask Udaan" title="Ask Udaan"><ArrowUp size={20} /></button></div>
              </div>
              <p id="search-description" className="advisor-caption">Udaan researches online and explains the findings. Your profile and assessment scores stay private.</p>
              <div className="advisor-composer-meta"><span id="voice-description">{voice.supported ? 'Speak in English. Review before sending.' : 'Voice typing is not supported here. You can type instead.'}</span><span id="question-limit">{question.length}/1000</span></div>
              {(voice.error || readAloud.error) && <p role="alert" className="advisor-error">{voice.error || readAloud.error}</p>}
              {notice && <p role="status" className="advisor-notice"><Check size={15} />{notice}</p>}
            </form>
          </section>
          <aside className="advisor-guide" aria-label="Career exploration guide">
            <AdvisorHistory disabled={busy || voiceBusy} onBusy={setHistoryBusy} onOpen={openSaved} onDelete={id => { setExchanges(old => old.filter(item => item.historyId !== id && item.result?.history_id !== id)); setFollowUp(current => current?.id === id ? null : current); }} />
            <section className="advisor-guide-personal"><span className="advisor-guide-icon"><Sparkles size={22} /></span><h2>Make it about you</h2><p>Discover why your saved pathways match your interests.</p><button className="advisor-secondary" disabled={locked} onClick={explain} aria-label="Understand my saved pathways">Explore my matches <ArrowUpRight size={16} /></button></section>
            <section className="advisor-guide-note"><Lightbulb size={20} /><h2>A good place to start</h2><p>Ask what someone does at work. Name a career, or choose Ask a follow-up on a sourced answer to keep exploring that topic.</p><div className="advisor-divider" /><h3><BookOpen size={16} /> What you can explore</h3><p>Ask about subjects, courses, skills, careers or your next education step. For admissions, name the course, institution and year; official information may still be unavailable.</p></section>
            <div className="advisor-privacy"><ShieldCheck size={16} /><p>New questions start fresh. Ask a follow-up carries the selected career topic. Completed answers are saved to your account in Previous questions, where you can reopen or delete them. Start fresh clears this view only.</p></div>
            <div className="advisor-privacy"><AudioLines size={16} /><p>Voice typing runs on your local server. Recordings aren't saved. Listen uses an on-device English voice{readAloud.available ? '.' : ', which is not available in this browser.'}</p></div>
          </aside>
        </div>
      </main>
    </div>
    <EditProfileDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
  </div>;
}
export default function CareerAdvisorPage() {
  const { user } = useAuth();
  return <AdvisorSession key={user?.id || 'anonymous'} />;
}

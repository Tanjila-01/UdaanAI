import React, { useEffect, useRef, useState } from 'react';
import { History, Trash2 } from 'lucide-react';
import { listCareerHistoryApi, getCareerHistoryApi, deleteCareerHistoryApi } from '../api/client';

export default function AdvisorHistory({ disabled, onOpen, onDelete, onBusy }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [offset, setOffset] = useState(0);
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(null);
  const pending = useRef(null);
  useEffect(() => () => { pending.current?.abort(); pending.current = null; }, []);
  async function run(work) {
    if (pending.current || disabled) return;
    const controller = new AbortController(); pending.current = controller;
    setBusy(true); onBusy(true); setError('');
    try { await work(controller.signal); }
    catch (failure) { if (!controller.signal.aborted) setError('History could not be updated. Please try again.'); }
    finally { if (pending.current === controller) { pending.current = null; setBusy(false); onBusy(false); } }
  }
  async function load(start, signal) {
    const result = await listCareerHistoryApi(start, { signal });
    if (signal.aborted) return;
    if (!Array.isArray(result?.items)) throw new Error('Invalid history');
    setItems(result.items); setMore(result.has_more); setOffset(start); setConfirm(null);
  }
  const toggle = () => {
    if (busy || disabled) return;
    setOpen(value => !value);
    if (!open) run(signal => load(0, signal));
  };
  const view = id => run(async signal => {
    const result = await getCareerHistoryApi(id, { signal });
    if (!signal.aborted) { onOpen(result); }
  });
  const remove = id => run(async signal => {
    await deleteCareerHistoryApi(id, { signal });
    if (signal.aborted) return;
    onDelete(id); setConfirm(null);
    await load(items.length === 1 && offset > 0 ? offset - 20 : offset, signal);
  });
  return <section className="advisor-history">
    <button type="button" className="advisor-history-toggle" disabled={disabled || busy} aria-expanded={open} onClick={toggle}><History size={17} /> Previous questions</button>
    {open && <div className="advisor-history-content">
      <p className="advisor-caption">Saved answers belong to your account. They are snapshots, not updated advice.</p>
      {busy && <p role="status" className="advisor-caption">Loading history…</p>}
      {error && <p role="alert" className="advisor-error">{error}</p>}
      {!busy && !error && items.length === 0 && <p className="advisor-caption">No saved answers yet. Completed career answers will appear here.</p>}
      <ul>{items.map(item => <li key={item.id} className="advisor-history-item">
        <button type="button" className="advisor-history-question" disabled={disabled || busy} onClick={() => view(item.id)}><span>{item.question}</span><time dateTime={item.created_at}>{new Date(item.created_at).toLocaleDateString()}</time></button>
        {confirm === item.id ? <div className="advisor-history-confirm"><span>Delete this saved answer?</span><button type="button" disabled={disabled || busy} onClick={() => remove(item.id)}>Delete</button><button type="button" disabled={busy} onClick={() => setConfirm(null)}>Keep</button></div>
          : <button type="button" className="advisor-icon-button" disabled={disabled || busy} aria-label={`Delete saved question: ${item.question}`} onClick={() => setConfirm(item.id)}><Trash2 size={14} /></button>}
      </li>)}</ul>
      <div className="advisor-history-pagination"><button type="button" disabled={disabled || busy || offset === 0} onClick={() => run(signal => load(Math.max(0, offset - 20), signal))}>Newer</button><button type="button" disabled={disabled || busy} onClick={() => run(signal => load(offset, signal))}>Refresh</button><button type="button" disabled={disabled || busy || !more} onClick={() => run(signal => load(offset + 20, signal))}>Older</button></div>
    </div>}
  </section>;
}

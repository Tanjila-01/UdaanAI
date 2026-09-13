import { useEffect, useRef, useState } from 'react';
import { transcribeCareerAudioApi } from '../api/client';

export function useLocalReadAloud() {
  const [voices, setVoices] = useState([]);
  const [speakingId, setSpeakingId] = useState(null);
  const [error, setError] = useState('');
  const generation = useRef(0);
  const utterance = useRef(null);
  const stop = () => {
    generation.current += 1;
    window.speechSynthesis?.cancel();
    utterance.current = null;
    setSpeakingId(null);
  };
  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth || !window.SpeechSynthesisUtterance) return;
    const refresh = () => setVoices(synth.getVoices().filter(voice => voice.localService && /^en(?:-|_)/i.test(voice.lang)));
    refresh(); synth.addEventListener('voiceschanged', refresh);
    return () => { generation.current += 1; synth.cancel(); synth.removeEventListener('voiceschanged', refresh); };
  }, []);
  function speak(id, text) {
    stop(); setError('');
    if (speakingId === id) return;
    const voice = voices.find(item => item.lang === 'en-IN') || voices[0];
    if (!voice) { setError('No on-device English voice is available. You can still read every answer.'); return; }
    const ticket = generation.current;
    // Short utterances avoid browser engines stopping in the middle of long answers.
    const chunks = text.replace(/\[\d+\]/g, '').match(/.{1,180}(?:\s|$)|\S{1,180}/g) || [];
    setSpeakingId(id);
    const next = () => {
      if (generation.current !== ticket) return;
      const textChunk = chunks.shift();
      if (!textChunk) { utterance.current = null; setSpeakingId(null); return; }
      const speech = new window.SpeechSynthesisUtterance(textChunk);
      utterance.current = speech;
      speech.voice = voice; speech.lang = voice.lang; speech.rate = 0.95;
      speech.onend = next;
      speech.onerror = () => {
        if (generation.current !== ticket) return;
        setSpeakingId(null); setError('Read-aloud stopped. Please try Listen again.');
      };
      try { window.speechSynthesis.speak(speech); } catch { speech.onerror(); }
    };
    next();
  }
  return { speak, stop, speakingId, error, available: voices.length > 0 };
}

export function useLocalVoiceInput(onTranscript) {
  const [phase, setPhase] = useState('idle');
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState('');
  const active = useRef(null);
  const callback = useRef(onTranscript);
  callback.current = onTranscript;
  const supported = typeof window.MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

  function release(session) {
    clearTimeout(session.timeout); clearInterval(session.interval);
    session.stream?.getTracks().forEach(track => track.stop());
  }
  function cancel() {
    const session = active.current;
    active.current = null;
    if (session) {
      session.controller.abort();
      if (session.recorder?.state === 'recording') session.recorder.stop();
      release(session);
    }
    setPhase('idle'); setSeconds(0);
  }
  useEffect(() => () => {
    const session = active.current;
    active.current = null;
    if (session) {
      session.controller.abort();
      if (session.recorder?.state === 'recording') session.recorder.stop();
      release(session);
    }
  }, []);

  function finish() {
    const session = active.current;
    if (session?.recorder?.state === 'recording') {
      session.recorder.stop(); release(session); setPhase('transcribing');
    }
  }
  async function start() {
    if (active.current) return;
    setError(''); setSeconds(0);
    if (!supported) { setError('Voice typing needs a supported browser on localhost or HTTPS. You can type instead.'); return; }
    const session = { controller: new AbortController(), chunks: [], bytes: 0 };
    active.current = session; setPhase('starting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      session.stream = stream;
      if (active.current !== session) { release(session); return; }
      const mimeType = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4'].find(type => window.MediaRecorder.isTypeSupported(type));
      if (!mimeType) throw new Error('unsupported');
      const recorder = new window.MediaRecorder(stream, { mimeType, audioBitsPerSecond: 64000 });
      session.recorder = recorder;
      recorder.ondataavailable = event => {
        if (active.current !== session || !event.data.size) return;
        session.bytes += event.data.size;
        if (session.bytes > 4 * 1024 * 1024) { cancel(); setError('Recording is too large. Please try a shorter question.'); return; }
        session.chunks.push(event.data);
      };
      recorder.onerror = () => { if (active.current === session) { cancel(); setError('Recording stopped unexpectedly. Please try again.'); } };
      recorder.onstop = async () => {
        release(session);
        if (active.current !== session) return;
        setPhase('transcribing');
        try {
          const result = await transcribeCareerAudioApi(new Blob(session.chunks, { type: mimeType }), { signal: session.controller.signal });
          if (active.current !== session) return;
          if (typeof result?.text !== 'string' || !result.text.trim()) throw new Error('empty');
          callback.current(result.text.trim());
        } catch (failure) {
          if (active.current !== session) return;
          const status = failure.response?.status;
          setError(status === 429 ? 'The local AI is busy. Please wait, then record again.'
            : status === 422 ? 'We could not hear a clear, short question. Please try again.'
            : 'Voice typing is unavailable. Please type your question or try recording again.');
        } finally {
          if (active.current === session) { active.current = null; setPhase('idle'); }
        }
      };
      recorder.start(250); setPhase('recording');
      session.interval = setInterval(() => setSeconds(value => value + 1), 1000);
      // Leave room for encoder padding under the server's strict 30-second limit.
      session.timeout = setTimeout(finish, 29000);
    } catch (failure) {
      if (active.current !== session) return;
      cancel();
      setError(failure.name === 'NotAllowedError' ? 'Microphone access was not allowed. Enable it in your browser or type your question.'
        : failure.name === 'NotFoundError' ? 'No microphone was found. You can type your question instead.'
        : 'This browser could not start recording. Please type your question instead.');
    }
  }
  return { phase, seconds, error, supported, start, finish, cancel };
}

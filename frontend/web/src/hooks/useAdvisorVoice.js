import { useEffect, useRef, useState } from 'react';
import { transcribeCareerAudioApi } from '../api/client';

export const SUPPORTED_VOICE_LANGUAGES = ['en'];

export function normalizeVoiceLanguage(language) {
  const value = String(language || '').trim().toLowerCase();
  if (value === 'en' || value === 'english') return 'en';
  return null;
}

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

export function useLocalVoiceInput(onTranscript, options = {}) {
  const normalizedLang = options?.language === undefined ? 'en' : normalizeVoiceLanguage(options?.language);
  const [phase, setPhase] = useState('idle');
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState('');
  const active = useRef(null);
  const callback = useRef(onTranscript);
  callback.current = onTranscript;
  const languageRef = useRef(normalizedLang);
  languageRef.current = normalizedLang;
  const supported = typeof window.MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

  function release(session) {
    if (!session) return;
    clearTimeout(session.timeout);
    clearInterval(session.interval);
    session.stream?.getTracks().forEach(track => {
      try { track.stop(); } catch {}
    });
  }

  function cleanupSession(session) {
    if (!session) return;
    session.completed = true;
    if (session.recorder) {
      session.recorder.ondataavailable = null;
      session.recorder.onerror = null;
      session.recorder.onstop = null;
      if (session.recorder.state === 'recording') {
        try { session.recorder.stop(); } catch {}
      }
    }
    release(session);
    if (active.current === session) {
      active.current = null;
    }
    setPhase('idle');
    setSeconds(0);
  }

  function cancel() {
    const session = active.current;
    if (session) {
      session.controller.abort();
      cleanupSession(session);
    } else {
      setPhase('idle');
      setSeconds(0);
    }
  }

  useEffect(() => () => {
    const session = active.current;
    if (session) {
      session.controller.abort();
      cleanupSession(session);
    }
  }, []);

  function finishSession(session) {
    if (!session || active.current !== session || session.finishing || session.completed) return;
    session.finishing = true;
    clearTimeout(session.timeout);
    clearInterval(session.interval);

    if (session.recorder && session.recorder.state === 'recording') {
      setPhase('transcribing');
      try {
        session.recorder.stop();
      } catch {
        cleanupSession(session);
        return;
      }
      session.stream?.getTracks().forEach(track => {
        try { track.stop(); } catch {}
      });
    } else {
      cleanupSession(session);
    }
  }

  function finish() {
    finishSession(active.current);
  }

  async function start() {
    if (active.current) return;

    setError('');
    setSeconds(0);

    const lang = languageRef.current;
    if (!lang) {
      setError('Voice typing is available in English only.');
      return;
    }
    if (!supported) {
      setError('Voice typing needs a supported browser on localhost or HTTPS. You can type instead.');
      return;
    }

    const session = {
      controller: new AbortController(),
      chunks: [],
      bytes: 0,
      finishing: false,
      transcribing: false,
      completed: false,
      timeout: null,
      interval: null,
      stream: null,
      recorder: null,
      language: lang,
    };
    active.current = session;
    setPhase('starting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      session.stream = stream;
      if (active.current !== session || session.completed) {
        release(session);
        return;
      }

      const mimeType = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4'].find(type => window.MediaRecorder.isTypeSupported(type));
      if (!mimeType) throw new Error('unsupported');
      session.mimeType = mimeType;

      const recorder = new window.MediaRecorder(stream, { mimeType, audioBitsPerSecond: 64000 });
      session.recorder = recorder;

      recorder.ondataavailable = event => {
        if (active.current !== session || session.completed || !event.data?.size) return;
        session.bytes += event.data.size;
        if (session.bytes > 4 * 1024 * 1024) {
          cleanupSession(session);
          setError('Recording is too large. Please try a shorter question.');
          return;
        }
        session.chunks.push(event.data);
      };

      recorder.onerror = () => {
        if (active.current === session && !session.completed) {
          cleanupSession(session);
          setError('Recording stopped unexpectedly. Please try again.');
        }
      };

      recorder.onstop = async () => {
        if (active.current !== session || session.transcribing || session.completed) {
          return;
        }
        session.transcribing = true;
        release(session);
        setPhase('transcribing');

        try {
          if (!session.chunks.length || session.bytes === 0) {
            setError('We could not hear a clear, short question. Please try again.');
            return;
          }
          const blob = new Blob(session.chunks, { type: session.mimeType || mimeType });
          if (!blob.size) {
            setError('We could not hear a clear, short question. Please try again.');
            return;
          }
          const sessionLang = session.language || languageRef.current;
          if (!sessionLang) {
            setError('Voice typing is available in English and Kannada only.');
            return;
          }

          const result = await transcribeCareerAudioApi(blob, {
            language: sessionLang,
            signal: session.controller.signal,
          });

          if (active.current !== session || session.completed) return;
          if (typeof result?.text !== 'string' || !result.text.trim()) throw new Error('empty');
          callback.current(result.text.trim());
        } catch (failure) {
          if (active.current !== session || session.completed) return;
          if (session.controller.signal.aborted) return;
          const status = failure?.response?.status;
          setError(
            status === 429
              ? 'Voice typing is busy. Please wait, then record again.'
              : status === 422
              ? 'We could not hear a clear, short question. Please try again.'
              : 'Voice typing is unavailable. Please type your question or try recording again.'
          );
        } finally {
          if (active.current === session) {
            cleanupSession(session);
          }
        }
      };

      recorder.start(250);
      setPhase('recording');
      session.interval = setInterval(() => setSeconds(value => value + 1), 1000);
      session.timeout = setTimeout(() => finishSession(session), 29000);
    } catch (failure) {
      if (active.current !== session || session.completed) return;
      cleanupSession(session);
      setError(
        failure.name === 'NotAllowedError'
          ? 'Microphone access was not allowed. Enable it in your browser or type your question.'
          : failure.name === 'NotFoundError'
          ? 'No microphone was found. You can type your question instead.'
          : 'This browser could not start recording. Please type your question instead.'
      );
    }
  }

  return { phase, seconds, error, supported, start, finish, cancel };
}

import { act, renderHook, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLocalReadAloud, useLocalVoiceInput, normalizeVoiceLanguage, SUPPORTED_VOICE_LANGUAGES } from '../useAdvisorVoice';
import { transcribeCareerAudioApi } from '../../api/client';
vi.mock('../../api/client', () => ({ transcribeCareerAudioApi: vi.fn() }));

let recorder, tracks, getUserMedia;
class Recorder {
  static isTypeSupported() { return true; }
  constructor() { recorder = this; this.state = 'inactive'; }
  start() { this.state = 'recording'; }
  stop() {
    this.state = 'inactive';
    this.ondataavailable?.({ data: new Blob(['audio'], { type: 'audio/webm' }) });
    this.onstop?.();
  }
}
beforeEach(() => {
  vi.resetAllMocks(); tracks = [{ stop: vi.fn() }];
  getUserMedia = vi.fn().mockResolvedValue({ getTracks: () => tracks });
  vi.stubGlobal('MediaRecorder', Recorder);
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia } });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('Local voice input', () => {
  it('only records on request and gives the transcript to the composer for review', async () => {
    const onText = vi.fn(); transcribeCareerAudioApi.mockResolvedValue({ text: 'What do designers do?' });
    const { result } = renderHook(() => useLocalVoiceInput(onText));
    expect(getUserMedia).not.toHaveBeenCalled();
    await act(() => result.current.start());
    expect(result.current.phase).toBe('recording');
    await act(() => result.current.finish());
    await waitFor(() => expect(onText).toHaveBeenCalledWith('What do designers do?'));
    expect(tracks[0].stop).toHaveBeenCalled();
    expect(result.current.phase).toBe('idle');
  });
  it('cancels recordings without uploading audio', async () => {
    const { result } = renderHook(() => useLocalVoiceInput(vi.fn()));
    await act(() => result.current.start());
    act(() => result.current.cancel());
    expect(transcribeCareerAudioApi).not.toHaveBeenCalled();
    expect(tracks[0].stop).toHaveBeenCalled();
  });
  it('releases late microphone permission after unmount', async () => {
    let grant; getUserMedia.mockReturnValue(new Promise(resolve => { grant = resolve; }));
    const { result, unmount } = renderHook(() => useLocalVoiceInput(vi.fn()));
    act(() => { result.current.start(); }); unmount();
    await act(async () => grant({ getTracks: () => tracks }));
    expect(tracks[0].stop).toHaveBeenCalled();
    expect(transcribeCareerAudioApi).not.toHaveBeenCalled();
  });
  it('does not replace text after cancelling a pending transcription', async () => {
    let resolve; const onText = vi.fn();
    transcribeCareerAudioApi.mockReturnValue(new Promise(done => { resolve = done; }));
    const { result } = renderHook(() => useLocalVoiceInput(onText));
    await act(() => result.current.start()); act(() => result.current.finish());
    const signal = transcribeCareerAudioApi.mock.calls[0][1].signal;
    act(() => result.current.cancel()); await act(async () => resolve({ text: 'Late result' }));
    expect(signal.aborted).toBe(true); expect(onText).not.toHaveBeenCalled();
  });
  it('handles denied microphone access without an upload', async () => {
    getUserMedia.mockRejectedValue({ name: 'NotAllowedError' });
    const { result } = renderHook(() => useLocalVoiceInput(vi.fn()));
    await act(() => result.current.start());
    expect(result.current.error).toContain('Microphone access was not allowed');
    expect(result.current.phase).toBe('idle');
    expect(transcribeCareerAudioApi).not.toHaveBeenCalled();
  });
  it('stops recording automatically before the server duration limit', async () => {
    vi.useFakeTimers(); transcribeCareerAudioApi.mockResolvedValue({ text: 'Question' });
    const { result } = renderHook(() => useLocalVoiceInput(vi.fn()));
    await act(() => result.current.start());
    await act(async () => vi.advanceTimersByTime(29000));
    expect(recorder.state).toBe('inactive');
    expect(transcribeCareerAudioApi).toHaveBeenCalledTimes(1);
    expect(tracks[0].stop).toHaveBeenCalled();
  });
  it('allows recording again immediately after transcription succeeds', async () => {
    const onText = vi.fn();
    transcribeCareerAudioApi
      .mockResolvedValueOnce({ text: 'First question' })
      .mockResolvedValueOnce({ text: 'Second question' });
    const { result } = renderHook(() => useLocalVoiceInput(onText));

    // First recording
    await act(() => result.current.start());
    expect(result.current.phase).toBe('recording');
    await act(() => result.current.finish());
    await waitFor(() => expect(onText).toHaveBeenCalledWith('First question'));
    expect(result.current.phase).toBe('idle');

    // Second recording
    await act(() => result.current.start());
    expect(result.current.phase).toBe('recording');
    await act(() => result.current.finish());
    await waitFor(() => expect(onText).toHaveBeenCalledWith('Second question'));
    expect(result.current.phase).toBe('idle');
  });
  it('resets busy state on 429 and clears error on subsequent Speak click', async () => {
    transcribeCareerAudioApi.mockRejectedValueOnce({ response: { status: 429 } });
    const onText = vi.fn();
    const { result } = renderHook(() => useLocalVoiceInput(onText));

    await act(() => result.current.start());
    await act(() => result.current.finish());
    expect(result.current.phase).toBe('idle');
    expect(result.current.error).toBe('Voice typing is busy. Please wait, then record again.');

    // Second click on Speak
    transcribeCareerAudioApi.mockResolvedValueOnce({ text: 'Recovered question' });
    await act(() => result.current.start());
    expect(result.current.error).toBe('');
    expect(result.current.phase).toBe('recording');
    await act(() => result.current.finish());
    await waitFor(() => expect(onText).toHaveBeenCalledWith('Recovered question'));
    expect(result.current.phase).toBe('idle');
  });
  it('resets busy state on network failure and allows retry', async () => {
    transcribeCareerAudioApi.mockRejectedValueOnce(new Error('Network error'));
    const { result } = renderHook(() => useLocalVoiceInput(vi.fn()));

    await act(() => result.current.start());
    await act(() => result.current.finish());
    expect(result.current.phase).toBe('idle');
    expect(result.current.error).toContain('Voice typing is unavailable');

    await act(() => result.current.start());
    expect(result.current.error).toBe('');
    expect(result.current.phase).toBe('recording');
    act(() => result.current.cancel());
    expect(result.current.phase).toBe('idle');
  });
  it('handles empty audio gracefully without calling API', async () => {
    const { result } = renderHook(() => useLocalVoiceInput(vi.fn()));
    // Mock empty recorder chunk
    class EmptyRecorder extends Recorder {
      stop() {
        this.state = 'inactive';
        this.onstop?.();
      }
    }
    vi.stubGlobal('MediaRecorder', EmptyRecorder);

    await act(() => result.current.start());
    await act(() => result.current.finish());
    await waitFor(() => expect(result.current.phase).toBe('idle'));
    expect(result.current.error).toContain('We could not hear a clear');
  });
  it('prevents multiple simultaneous recording sessions on rapid repeated clicks', async () => {
    const { result } = renderHook(() => useLocalVoiceInput(vi.fn()));
    await act(async () => {
      const p1 = result.current.start();
      const p2 = result.current.start();
      await Promise.all([p1, p2]);
    });
    expect(getUserMedia).toHaveBeenCalledTimes(1);
    expect(result.current.phase).toBe('recording');
    act(() => result.current.cancel());
    expect(result.current.phase).toBe('idle');
  });
  it('sends language=en when English is configured', async () => {
    transcribeCareerAudioApi.mockResolvedValueOnce({ text: 'English question' });
    const { result } = renderHook(() => useLocalVoiceInput(vi.fn(), { language: 'en' }));
    await act(() => result.current.start());
    await act(() => result.current.finish());
    await waitFor(() => expect(transcribeCareerAudioApi).toHaveBeenCalledTimes(1));
    expect(transcribeCareerAudioApi.mock.calls[0][1].language).toBe('en');
  });
  it('sends language=en when english alias is configured', async () => {
    transcribeCareerAudioApi.mockResolvedValueOnce({ text: 'English question' });
    const { result } = renderHook(() => useLocalVoiceInput(vi.fn(), { language: 'english' }));
    await act(() => result.current.start());
    await act(() => result.current.finish());
    await waitFor(() => expect(transcribeCareerAudioApi).toHaveBeenCalledTimes(1));
    expect(transcribeCareerAudioApi.mock.calls[0][1].language).toBe('en');
  });
  it('does not send unsupported language to transcription API', async () => {
    for (const badLang of ['kn', 'kannada', 'hi', 'hindi', 'ta', 'te', 'ml', 'fr', 'es', 'random']) {
      const { result } = renderHook(() => useLocalVoiceInput(vi.fn(), { language: badLang }));
      await act(() => result.current.start());
      expect(result.current.error).toContain('English only');
      expect(result.current.phase).toBe('idle');
      expect(transcribeCareerAudioApi).not.toHaveBeenCalled();
    }
  });
  it('MediaRecorder error returns to idle and allows immediate retry', async () => {
    const { result } = renderHook(() => useLocalVoiceInput(vi.fn()));
    await act(() => result.current.start());
    expect(result.current.phase).toBe('recording');
    act(() => { recorder.onerror?.(new Event('error')); });
    expect(result.current.phase).toBe('idle');
    expect(result.current.error).toContain('Recording stopped unexpectedly');

    // Immediately start second recording
    await act(() => result.current.start());
    expect(result.current.error).toBe('');
    expect(result.current.phase).toBe('recording');
    act(() => result.current.cancel());
    expect(result.current.phase).toBe('idle');
  });
  it('multiple rapid finish calls are idempotent and do not abort transcription', async () => {
    let resolveApi;
    transcribeCareerAudioApi.mockReturnValue(new Promise(res => { resolveApi = res; }));
    const onText = vi.fn();
    const { result } = renderHook(() => useLocalVoiceInput(onText));

    await act(() => result.current.start());
    expect(result.current.phase).toBe('recording');

    // First finish triggers transcription
    act(() => result.current.finish());
    expect(result.current.phase).toBe('transcribing');

    // Second and third finish calls while transcribing must NOT call cancel or abort
    act(() => result.current.finish());
    act(() => result.current.finish());
    expect(result.current.phase).toBe('transcribing');

    await act(async () => {
      resolveApi({ text: 'Answer after idempotent finish' });
    });
    expect(onText).toHaveBeenCalledWith('Answer after idempotent finish');
    expect(result.current.phase).toBe('idle');
  });
  it('consecutive recordings cleanly nullify previous recorder event listeners', async () => {
    transcribeCareerAudioApi
      .mockResolvedValueOnce({ text: 'First question' })
      .mockResolvedValueOnce({ text: 'Second question' });
    const onText = vi.fn();
    const { result } = renderHook(() => useLocalVoiceInput(onText));

    await act(() => result.current.start());
    const firstRecorder = recorder;
    await act(() => result.current.finish());
    expect(result.current.phase).toBe('idle');

    // Previous recorder events must be cleaned up
    expect(firstRecorder.onstop).toBeNull();
    expect(firstRecorder.ondataavailable).toBeNull();
    expect(firstRecorder.onerror).toBeNull();

    // Second recording
    await act(() => result.current.start());
    const secondRecorder = recorder;
    expect(secondRecorder).not.toBe(firstRecorder);
    await act(() => result.current.finish());
    expect(result.current.phase).toBe('idle');
    expect(onText).toHaveBeenCalledTimes(2);
  });
  it('captures session language at start so mid-recording language change does not corrupt in-flight request', async () => {
    transcribeCareerAudioApi.mockResolvedValueOnce({ text: 'English question' });
    let lang = 'en';
    const { result, rerender } = renderHook(() => useLocalVoiceInput(vi.fn(), { language: lang }));

    await act(() => result.current.start());
    expect(result.current.phase).toBe('recording');

    // Profile updates language to Kannada during recording
    lang = 'kn';
    rerender();
    expect(result.current.phase).toBe('recording');

    await act(() => result.current.finish());
    expect(result.current.phase).toBe('idle');
    expect(transcribeCareerAudioApi).toHaveBeenCalledWith(
      expect.any(Blob),
      expect.objectContaining({ language: 'en' })
    );
  });
});

describe('On-device read-aloud', () => {
  it('selects only a local English voice and stops on unmount', () => {
    const localVoice = { lang: 'en-IN', localService: true };
    const synth = { getVoices: () => [{ lang: 'en-US', localService: false }, localVoice], addEventListener: vi.fn(), removeEventListener: vi.fn(), cancel: vi.fn(), speak: vi.fn() };
    vi.stubGlobal('speechSynthesis', synth);
    vi.stubGlobal('SpeechSynthesisUtterance', class { constructor(text) { this.text = text; } });
    const { result, unmount } = renderHook(useLocalReadAloud);
    act(() => result.current.speak(1, 'Developers create software. [1]'));
    expect(synth.speak.mock.calls[0][0].voice).toBe(localVoice);
    expect(synth.speak.mock.calls[0][0].text).not.toContain('[1]');
    expect(result.current.speakingId).toBe(1);
    unmount(); expect(synth.cancel).toHaveBeenCalled();
  });
  it('never uses a remote voice when local voices are missing', () => {
    const synth = { getVoices: () => [{ lang: 'en-US', localService: false }], addEventListener: vi.fn(), removeEventListener: vi.fn(), cancel: vi.fn(), speak: vi.fn() };
    vi.stubGlobal('speechSynthesis', synth); vi.stubGlobal('SpeechSynthesisUtterance', class {});
    const { result } = renderHook(useLocalReadAloud);
    act(() => result.current.speak(1, 'Hello'));
    expect(result.current.available).toBe(false); expect(synth.speak).not.toHaveBeenCalled();
  });
});

describe('Voice language normalization contract', () => {
  it('accepts and normalizes en', () => {
    expect(SUPPORTED_VOICE_LANGUAGES).toEqual(['en']);
    expect(normalizeVoiceLanguage('en')).toBe('en');
    expect(normalizeVoiceLanguage('EN')).toBe('en');
    expect(normalizeVoiceLanguage('english')).toBe('en');
    expect(normalizeVoiceLanguage('English')).toBe('en');
  });
  it('rejects unsupported languages, empty string, and null/undefined', () => {
    for (const lang of ['kn', 'kannada', 'hi', 'hindi', 'ta', 'te', 'ml', 'mr', 'bn', 'gu', 'or', 'pa', 'ur', 'as', 'fr', 'de', 'es', '', '  ', null, undefined]) {
      expect(normalizeVoiceLanguage(lang)).toBeNull();
    }
  });
});


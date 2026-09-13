import { act, renderHook, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLocalReadAloud, useLocalVoiceInput } from '../useAdvisorVoice';
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

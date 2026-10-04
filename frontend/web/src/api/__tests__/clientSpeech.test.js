import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transcribeCareerAudioApi, apiClient, normalizeVoiceLanguage, SUPPORTED_VOICE_LANGUAGES } from '../client';

describe('transcribeCareerAudioApi language contract', () => {
  const dummyBlob = new Blob(['mock-audio'], { type: 'audio/webm' });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sends language=en for en', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: { text: 'Hello', language: 'en' } });
    const result = await transcribeCareerAudioApi(dummyBlob, { language: 'en' });
    expect(result).toEqual({ text: 'Hello', language: 'en' });
    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(postSpy.mock.calls[0][1]).toBe(dummyBlob);
    expect(postSpy.mock.calls[0][2].params).toEqual({ language: 'en' });
  });

  it('normalizes english alias to en', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: { text: 'Hello', language: 'en' } });
    const result = await transcribeCareerAudioApi(dummyBlob, { language: 'english' });
    expect(result).toEqual({ text: 'Hello', language: 'en' });
    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(postSpy.mock.calls[0][2].params).toEqual({ language: 'en' });
  });

  it('rejects unsupported languages including Kannada before making network requests', async () => {
    const postSpy = vi.spyOn(apiClient, 'post');

    for (const badLang of ['kn', 'kannada', 'hi', 'hindi', 'ta', 'te', 'ml', 'mr', 'fr', 'es', 'random']) {
      await expect(transcribeCareerAudioApi(dummyBlob, { language: badLang }))
        .rejects
        .toThrow('Unsupported voice language. Supported languages: en');
    }

    expect(postSpy).not.toHaveBeenCalled();
  });

  it('rejects missing or empty language before making network requests', async () => {
    const postSpy = vi.spyOn(apiClient, 'post');

    await expect(transcribeCareerAudioApi(dummyBlob))
      .rejects
      .toThrow('Unsupported voice language. Supported languages: en');

    await expect(transcribeCareerAudioApi(dummyBlob, {}))
      .rejects
      .toThrow('Unsupported voice language. Supported languages: en');

    await expect(transcribeCareerAudioApi(dummyBlob, { language: '' }))
      .rejects
      .toThrow('Unsupported voice language. Supported languages: en');

    await expect(transcribeCareerAudioApi(dummyBlob, { language: null }))
      .rejects
      .toThrow('Unsupported voice language. Supported languages: en');

    expect(postSpy).not.toHaveBeenCalled();
  });
});

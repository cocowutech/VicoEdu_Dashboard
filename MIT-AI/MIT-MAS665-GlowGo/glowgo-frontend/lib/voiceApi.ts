/**
 * Voice API Client - Speech-to-Text and Text-to-Speech
 */

import apiClient from './api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface SpeechToTextResponse {
  text: string;
}

export interface TextToSpeechRequest {
  text: string;
  voice_id?: string;
}

/**
 * Convert audio to text using ElevenLabs STT
 * @param audioBlob - The recorded audio blob
 * @returns Recognized text
 */
export async function speechToText(audioBlob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');

  const response = await apiClient.post<SpeechToTextResponse>(
    '/api/voice/speech-to-text',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data.text;
}

/**
 * Convert text to speech using ElevenLabs TTS
 * @param text - The text to convert to speech
 * @param voiceId - Optional voice ID override
 * @returns Audio blob
 */
export async function textToSpeech(text: string, voiceId?: string): Promise<Blob> {
  const response = await apiClient.post(
    '/api/voice/text-to-speech',
    { text, voice_id: voiceId } as TextToSpeechRequest,
    {
      responseType: 'blob',
    }
  );

  return response.data;
}

"use client";

import { useState, useRef, useCallback } from 'react';

export interface UseVoiceRecordingResult {
  isRecording: boolean;
  audioBlob: Blob | null;
  startRecording: (autoStop?: boolean) => Promise<void>;
  stopRecording: () => Promise<void>;
  clearRecording: () => void;
  error: string | null;
}

/**
 * Hook for recording audio from the user's microphone
 * Uses the MediaRecorder API to capture audio in WebM format
 * Supports automatic silence detection to stop recording
 */
export function useVoiceRecording(): UseVoiceRecordingResult {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const startRecording = useCallback(async (autoStop: boolean = false) => {
    console.log('[VoiceRecording] startRecording called, autoStop:', autoStop)

    // Only run in browser
    if (typeof window === 'undefined' || !navigator.mediaDevices) {
      setError('Voice recording is not supported in this environment');
      return;
    }

    try {
      setError(null);
      setAudioBlob(null);
      audioChunksRef.current = [];

      console.log('[VoiceRecording] Requesting microphone access...')

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });

      streamRef.current = stream;

      // Determine the best MIME type
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/mpeg')) {
        mimeType = 'audio/mpeg';
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(audioBlob);

        // Clean up
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Recording error occurred');
        setIsRecording(false);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      console.log('[VoiceRecording] MediaRecorder started, isRecording set to true');

      // Set up silence detection if autoStop is enabled
      if (autoStop) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);

        // Add gain to boost quiet microphones (reduced from 3.0 to avoid amplifying noise)
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 2.0; // Boost by 2x (reduced to minimize background noise)

        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.8;

        // Connect: microphone -> gain -> analyser
        microphone.connect(gainNode);
        gainNode.connect(analyser);

        console.log('[VAD] Applied gain boost:', gainNode.gain.value + 'x');

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const SILENCE_THRESHOLD = 15; // Increased to better distinguish speech from background noise (0-255)
        const SILENCE_DURATION = 1200; // 1.2 seconds of silence to auto-stop
        const MIN_RECORDING_DURATION = 600; // Minimum 0.6 seconds before auto-stop
        const SPEECH_THRESHOLD = 25; // Threshold to detect actual speech (higher than silence threshold)
        let silenceStart: number | null = null;
        let hasSpeechDetected = false; // Track if we've detected actual speech
        const recordingStartTime = Date.now();

        console.log('[VAD] SILENCE_THRESHOLD:', SILENCE_THRESHOLD);
        console.log('[VAD] SPEECH_THRESHOLD:', SPEECH_THRESHOLD);
        console.log('[VAD] Auto-stop after', SILENCE_DURATION, 'ms of silence');

        const detectSilence = () => {
          if (!analyserRef.current || !mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
            // Stop the animation loop
            if (animationFrameRef.current) {
              cancelAnimationFrame(animationFrameRef.current);
              animationFrameRef.current = null;
            }
            return;
          }

          analyserRef.current.getByteFrequencyData(dataArray);

          // Calculate average volume
          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
          const elapsedTime = Date.now() - recordingStartTime;

          // Track if actual speech has been detected (not just noise)
          if (average >= SPEECH_THRESHOLD) {
            hasSpeechDetected = true;
          }

          // Log volume for debugging (always log to help diagnose issues)
          if (elapsedTime % 500 < 100) {
            console.log(`[VAD] Volume: ${average.toFixed(1)}, Speech detected: ${hasSpeechDetected}, Silence: ${silenceStart ? ((Date.now() - silenceStart) / 1000).toFixed(1) + 's' : 'none'}`);
          }

          // Don't stop recording before minimum duration
          if (elapsedTime < MIN_RECORDING_DURATION) {
            animationFrameRef.current = requestAnimationFrame(detectSilence);
            return;
          }

          // Only start counting silence if we've detected actual speech first
          // This prevents stopping too early if user is slow to start talking
          if (average < SILENCE_THRESHOLD) {
            // Silence detected
            if (hasSpeechDetected) {
              if (silenceStart === null) {
                silenceStart = Date.now();
                console.log('[VAD] Silence started after speech detected');
              } else if (Date.now() - silenceStart > SILENCE_DURATION) {
                // Stop recording after prolonged silence
                console.log('[VAD] Silence duration exceeded, auto-stopping recording');
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                  mediaRecorderRef.current.stop();
                  setIsRecording(false);
                }
                return;
              }
            }
            // If no speech detected yet, just wait
          } else {
            // Sound detected (above silence threshold), reset silence timer
            if (silenceStart !== null) {
              console.log('[VAD] Sound detected, resetting silence timer (volume: ' + average.toFixed(1) + ')');
            }
            silenceStart = null;
          }

          animationFrameRef.current = requestAnimationFrame(detectSilence);
        };

        // Start detection
        detectSilence();
      }

    } catch (err) {
      console.error('Error starting recording:', err);

      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('Microphone permission denied. Please allow microphone access.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError('No microphone found. Please connect a microphone.');
        } else {
          setError(`Error accessing microphone: ${err.message}`);
        }
      } else {
        setError('Unknown error accessing microphone');
      }

      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    return new Promise<void>((resolve) => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.onstop = () => {
          const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          setAudioBlob(audioBlob);
          setIsRecording(false);

          // Clean up stream
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }

          resolve();
        };

        mediaRecorderRef.current.stop();
      } else {
        resolve();
      }
    });
  }, [isRecording]);

  const clearRecording = useCallback(() => {
    setAudioBlob(null);
    setError(null);
    audioChunksRef.current = [];
  }, []);

  return {
    isRecording,
    audioBlob,
    startRecording,
    stopRecording,
    clearRecording,
    error,
  };
}

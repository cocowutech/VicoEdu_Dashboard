/**
 * Audio Utilities for Text-to-Speech playback
 */

/**
 * Play audio from a URL or Blob
 * @param audioSource - URL string or Blob object
 * @returns Promise that resolves when audio finishes playing
 */
export async function playAudio(audioSource: string | Blob): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      console.log('[Audio] Creating audio element...');
      const audio = new Audio();

      // Set source based on type
      if (typeof audioSource === 'string') {
        console.log('[Audio] Using URL source:', audioSource);
        audio.src = audioSource;
      } else {
        const blobUrl = URL.createObjectURL(audioSource);
        console.log('[Audio] Created blob URL:', blobUrl);
        console.log('[Audio] Blob size:', audioSource.size, 'bytes');
        console.log('[Audio] Blob type:', audioSource.type);
        audio.src = blobUrl;
      }

      // Event handlers
      audio.onloadedmetadata = () => {
        console.log('[Audio] Metadata loaded. Duration:', audio.duration, 'seconds');
      };

      audio.oncanplay = () => {
        console.log('[Audio] Can play - audio is ready');
      };

      audio.onplay = () => {
        console.log('[Audio] ▶️ Playback started');
      };

      audio.onended = () => {
        console.log('[Audio] ✅ Playback completed');
        // Clean up object URL if it was created
        if (audioSource instanceof Blob) {
          URL.revokeObjectURL(audio.src);
        }
        resolve();
      };

      audio.onerror = (error) => {
        console.error('[Audio] ❌ Playback error:', error);
        console.error('[Audio] Error code:', audio.error?.code);
        console.error('[Audio] Error message:', audio.error?.message);
        if (audioSource instanceof Blob) {
          URL.revokeObjectURL(audio.src);
        }
        reject(new Error(`Failed to play audio: ${audio.error?.message || 'Unknown error'}`));
      };

      // Start playback
      console.log('[Audio] Starting playback...');
      audio.play().catch(error => {
        console.error('[Audio] ❌ Failed to start audio playback:', error);
        if (audioSource instanceof Blob) {
          URL.revokeObjectURL(audio.src);
        }
        reject(error);
      });

    } catch (error) {
      console.error('[Audio] ❌ Error creating audio element:', error);
      reject(error);
    }
  });
}

/**
 * Create an audio element with controls for manual playback
 * Useful for debugging or giving users manual control
 * @param audioSource - URL string or Blob object
 * @returns HTML Audio Element
 */
export function createAudioElement(audioSource: string | Blob): HTMLAudioElement {
  const audio = new Audio();

  if (typeof audioSource === 'string') {
    audio.src = audioSource;
  } else {
    audio.src = URL.createObjectURL(audioSource);
  }

  audio.controls = true;

  return audio;
}

/**
 * Stop all currently playing audio elements
 */
export function stopAllAudio(): void {
  const audioElements = document.querySelectorAll('audio');
  audioElements.forEach(audio => {
    audio.pause();
    audio.currentTime = 0;
  });
}

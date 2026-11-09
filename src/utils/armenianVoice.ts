import { ProductItem } from '../types';

// Client-side cache for instant 0ms replay of generated Armenian TTS audio
const audioDataCache = new Map<string, string>();
let activeAudio: HTMLAudioElement | null = null;
let currentSpeechId = 0;
let preferLocalBrowserVoice = false;

/**
 * Builds a calm, polite, unhurried Armenian presentation script for a product in the 3D showcase.
 * Always returns Armenian text regardless of the UI language, avoiding symbols like '֏'
 * so TTS engines pronounce every word naturally and smoothly.
 */
export function buildCalmArmenianPresentationText(product: ProductItem): string {
  const cleanName = (product.nameHy || product.nameRu || '').replace(/֏/g, 'դրամ').trim();
  const cleanUnit = (product.unitHy || 'հատ').replace(/֏/g, 'դրամ').trim();
  const price = Math.round(Number(product.priceDram) || 0);

  return `Բարև Ձեզ... Դուք ընտրել եք՝ ${cleanName}։ Արժեքը՝ ${price} դրամ, մեկ ${cleanUnit}-ի համար... Համակարգ երկու հազարում այս գնումը ապահովում է տասը տոկոս ցմահ ավանդ՝ ժառանգության իրավունքով, և հինգ տոկոս քեշբեք։ Սիրով կարող եք ավելացնել զամբյուղում։`;
}

/**
 * Builds a calm Armenian script for the 360-degree 3D product inspection modal.
 */
export function buildCalmArmenianInspectionText(product: ProductItem): string {
  const cleanName = (product.nameHy || product.nameRu || '').replace(/֏/g, 'դրամ').trim();
  const cleanDesc = (product.descriptionHy || product.descriptionRu || '').replace(/֏/g, 'դրամ').trim();
  const price = Math.round(Number(product.priceDram) || 0);

  return `Եռաչափ մանրամասն զննում... ${cleanName}։ Արժեքը՝ ${price} դրամ... ${cleanDesc}։ Գործում է տասը տոկոս ցմահ ավանդի երաշխիք։`;
}

/**
 * Stops any active Armenian voice playback (both HTMLAudioElement and Web Speech API).
 */
export function stopCalmArmenianSpeech(onStopCallback?: () => void): void {
  currentSpeechId++;
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    } catch {
      // ignore
    }
    activeAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
  if (onStopCallback) onStopCallback();
}

/**
 * Helper to speak calm Armenian via browser Web Speech API fallback
 */
function speakViaBrowserHy(
  textHy: string,
  speechId: number,
  onStart?: () => void,
  onEnd?: () => void
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(textHy);
  utterance.lang = 'hy-AM';
  // Calm, gentle, unhurried delivery
  utterance.rate = 0.84;
  utterance.pitch = 0.93;
  utterance.volume = 0.92;

  const voices = window.speechSynthesis.getVoices();
  const hyVoice =
    voices.find((v) => v.lang.toLowerCase().includes('hy')) ||
    voices.find((v) => v.name.toLowerCase().includes('armenian') || v.name.toLowerCase().includes('anahit'));
  if (hyVoice) {
    utterance.voice = hyVoice;
  }

  utterance.onstart = () => {
    if (speechId === currentSpeechId && onStart) onStart();
  };
  utterance.onend = () => {
    if (speechId === currentSpeechId && onEnd) onEnd();
  };
  utterance.onerror = () => {
    if (speechId === currentSpeechId && onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
}

/**
 * Speaks the given Armenian text in a calm, warm, soothing Armenian voice.
 * Uses cached Gemini TTS (`gemini-3.8-flash-lite-tts`) when available and switches
 * immediately to 0ms calm `hy-AM` Web Speech API if offline or credits are depleted.
 */
export async function speakCalmArmenian(
  textHy: string,
  cacheKey: string,
  onStart?: () => void,
  onEnd?: () => void
): Promise<void> {
  stopCalmArmenianSpeech();
  const mySpeechId = ++currentSpeechId;

  const playAudioDataUrl = (dataUrl: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (mySpeechId !== currentSpeechId) {
        resolve(false);
        return;
      }
      const audio = new Audio(dataUrl);
      activeAudio = audio;
      audio.playbackRate = 0.94; // Calm, unhurried cadence
      audio.volume = 0.92;

      audio.onplay = () => {
        if (mySpeechId === currentSpeechId && onStart) onStart();
      };
      audio.onended = () => {
        if (activeAudio === audio) activeAudio = null;
        if (mySpeechId === currentSpeechId && onEnd) onEnd();
        resolve(true);
      };
      audio.onerror = () => {
        if (activeAudio === audio) activeAudio = null;
        resolve(false);
      };

      audio.play().catch(() => {
        if (activeAudio === audio) activeAudio = null;
        resolve(false);
      });
    });
  };

  // 1. Instant 0ms playback from client memory cache
  const cachedAudio = audioDataCache.get(cacheKey);
  if (cachedAudio) {
    const ok = await playAudioDataUrl(cachedAudio);
    if (ok) return;
  }

  // 2. If server TTS previously indicated fallback / depleted credits, speak immediately in 0ms
  if (preferLocalBrowserVoice) {
    speakViaBrowserHy(textHy, mySpeechId, onStart, onEnd);
    return;
  }

  // 3. Request server-side calm Armenian TTS (`gemini-3.8-flash-lite-tts`) with fast timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1800);

    const res = await fetch('/api/tts/armenian', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: textHy, cacheKey }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (mySpeechId !== currentSpeechId) return;

    if (res.ok) {
      const data = await res.json();
      if (data?.audioUrl) {
        audioDataCache.set(cacheKey, data.audioUrl);
        const played = await playAudioDataUrl(data.audioUrl);
        if (played) return;
      }
      if (data?.fallback || data?.quotaDepleted) {
        preferLocalBrowserVoice = true;
      }
    } else {
      preferLocalBrowserVoice = true;
    }
  } catch {
    preferLocalBrowserVoice = true;
  }

  if (mySpeechId !== currentSpeechId) return;

  // 4. Calm Armenian Web Speech API fallback (rate=0.84, pitch=0.93, lang='hy-AM')
  speakViaBrowserHy(textHy, mySpeechId, onStart, onEnd);
}

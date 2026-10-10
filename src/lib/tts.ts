/**
 * src/lib/tts.ts
 *
 * THE BUG: AppTour used `window.speechSynthesis` directly. That's the Web
 * Speech API, and Android's system WebView (what every Capacitor app runs
 * inside) ships a `speechSynthesis` object that LOOKS present — so no error,
 * no console warning — but `getVoices()` returns an empty array and
 * `speak()` silently does nothing on most Android versions/OEM WebViews.
 * It works fine in Chrome/desktop browser testing, which is why it looked
 * "done" — but on the actual packaged app (android/ folder here) tour
 * narration was always silent.
 *
 * FIX: on native platforms, use @capacitor-community/text-to-speech, which
 * calls the OS TextToSpeech engine directly instead of the WebView's broken
 * Web Speech shim. On web, keep using window.speechSynthesis (works fine in
 * real browsers).
 */
import { Capacitor } from '@capacitor/core';

let nativeTTS: typeof import('@capacitor-community/text-to-speech').TextToSpeech | null = null;
const isNative = Capacitor.isNativePlatform();

async function getNativeTTS() {
  if (!nativeTTS) {
    const mod = await import('@capacitor-community/text-to-speech');
    nativeTTS = mod.TextToSpeech;
  }
  return nativeTTS;
}

export async function speak(text: string, opts: { rate?: number; pitch?: number } = {}) {
  const rate = opts.rate ?? 1.05;
  const pitch = opts.pitch ?? 1.1;

  if (isNative) {
    try {
      const TTS = await getNativeTTS();
      await TTS.speak({ text, rate, pitch, category: 'ambient' });
    } catch (e) {
      console.error('[tts] native speak failed:', e);
    }
    return;
  }

  // Web fallback — real browsers implement this properly.
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = rate;
  u.pitch = pitch;
  window.speechSynthesis.speak(u);
}

export async function stopSpeaking() {
  if (isNative) {
    try {
      const TTS = await getNativeTTS();
      await TTS.stop();
    } catch {
      // no-op
    }
    return;
  }
  window.speechSynthesis?.cancel();
}

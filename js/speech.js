// Thin wrapper over the Web Speech API. Every function degrades to a no-op when unsupported.
// One recognition session at a time; speak() resolves false when it was cancelled.

const synth = globalThis.speechSynthesis;
const Recognition = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;

let voicesCache = null;
let speakEpoch = 0;
let active = null; // current recognition session

function pickVoice() {
  if (!synth) return null;
  const voices = synth.getVoices();
  if (voices.length) voicesCache = voices;
  const list = voicesCache || [];
  const prefer = (lang) => list.find((v) => v.lang.replace('_', '-').toLowerCase().startsWith(lang) && !v.localService) || list.find((v) => v.lang.replace('_', '-').toLowerCase().startsWith(lang));
  return prefer('en-gb') || prefer('en-us') || prefer('en') || null;
}

if (synth) {
  synth.addEventListener?.('voiceschanged', () => { voicesCache = synth.getVoices(); });
}

export function canSpeak() {
  return Boolean(synth && globalThis.SpeechSynthesisUtterance);
}

export function stopSpeaking() {
  speakEpoch += 1;
  if (synth) synth.cancel();
}

// Resolves true when the utterance finished, false when it was cancelled or unsupported.
export function speak(text, { rate = 1 } = {}) {
  if (!canSpeak()) return Promise.resolve(false);
  return new Promise((resolve) => {
    synth.cancel();
    const epoch = ++speakEpoch;
    const u = new SpeechSynthesisUtterance(text);
    const voice = pickVoice();
    if (voice) u.voice = voice;
    u.lang = voice?.lang || 'en-GB';
    u.rate = rate;
    u.onend = () => resolve(epoch === speakEpoch);
    u.onerror = () => resolve(false);
    synth.speak(u);
  });
}

export function canListen() {
  return Boolean(Recognition);
}

export function isListening() {
  return Boolean(active);
}

export function stopListening() {
  if (active) active.stop();
}

const ERROR_MESSAGES = {
  'not-allowed': 'Microfono non autorizzato dal browser.',
  'service-not-allowed': 'Riconoscimento vocale non disponibile.',
  'audio-capture': 'Nessun microfono trovato.',
  network: 'Il riconoscimento vocale richiede la connessione.',
  'language-not-supported': 'Lingua non supportata dal riconoscimento vocale.',
};

export function errorMessage(code) {
  return ERROR_MESSAGES[code] || 'Riconoscimento vocale interrotto.';
}

// Starts listening. Restarts itself when the engine stops on its own (silence) until stop() is called.
export function listen({ lang = 'en-GB', onInterim, onError } = {}) {
  if (!Recognition) return { stop() {}, result: Promise.resolve('') };
  if (active) active.stop();
  let finalText = '';
  let interimText = '';
  let wantRunning = true;
  let resolveResult;
  const result = new Promise((resolve) => { resolveResult = resolve; });
  const session = { stop() { wantRunning = false; try { rec.stop(); } catch { finish(); } } };
  const finish = () => {
    if (active === session) active = null;
    resolveResult((finalText + ' ' + interimText).trim());
  };
  const rec = new Recognition();
  rec.lang = lang;
  rec.continuous = true;
  rec.interimResults = true;
  rec.onresult = (ev) => {
    interimText = '';
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const r = ev.results[i];
      if (r.isFinal) finalText += r[0].transcript + ' ';
      else interimText += r[0].transcript;
    }
    onInterim?.((finalText + interimText).trim());
  };
  rec.onerror = (ev) => {
    const code = ev?.error;
    if (code === 'no-speech' || code === 'aborted') return; // harmless: onend will restart or finish
    wantRunning = false;
    onError?.(code);
  };
  rec.onend = () => {
    if (wantRunning) {
      try { rec.start(); return; } catch { /* fall through */ }
    }
    finish();
  };
  try { rec.start(); active = session; } catch { finish(); }
  return { stop: session.stop, result };
}

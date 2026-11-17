// Thin wrapper over the Web Speech API. Every function degrades to a no-op when unsupported.

const synth = globalThis.speechSynthesis;
const Recognition = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;

let voicesCache = null;

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
  if (synth) synth.cancel();
}

export function speak(text, { rate = 1 } = {}) {
  if (!canSpeak()) return Promise.resolve();
  return new Promise((resolve) => {
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voice = pickVoice();
    if (voice) u.voice = voice;
    u.lang = voice?.lang || 'en-GB';
    u.rate = rate;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    synth.speak(u);
  });
}

export function canListen() {
  return Boolean(Recognition);
}

export function listen({ lang = 'en-GB', onInterim } = {}) {
  if (!Recognition) return { stop() {}, result: Promise.resolve('') };
  const rec = new Recognition();
  rec.lang = lang;
  rec.continuous = true;
  rec.interimResults = true;
  let finalText = '';
  let resolveResult;
  const result = new Promise((resolve) => { resolveResult = resolve; });
  rec.onresult = (ev) => {
    let interim = '';
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const r = ev.results[i];
      if (r.isFinal) finalText += r[0].transcript + ' ';
      else interim += r[0].transcript;
    }
    onInterim?.((finalText + interim).trim());
  };
  rec.onerror = () => { try { rec.stop(); } catch { /* ignore */ } };
  rec.onend = () => resolveResult(finalText.trim());
  try { rec.start(); } catch { resolveResult(''); }
  return {
    stop() { try { rec.stop(); } catch { resolveResult(finalText.trim()); } },
    result,
  };
}

import { h } from '../../dom.js';
import { keyPhraseCoverage } from '../../grading.js';

// Builds the model text with <mark> around key phrases, as DOM nodes (no innerHTML).
// Matching is case-insensitive and tolerates punctuation between words and curly apostrophes.
export function highlightNodes(model, keyPhrases) {
  const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/['\u2019]/g, "['\u2019]");
  const ranges = [];
  for (const k of keyPhrases) {
    const words = k.trim().split(/\s+/).filter(Boolean).map(esc);
    if (!words.length) continue;
    const re = new RegExp(`(?<![A-Za-z0-9])${words.join('[\\s,;:.!?\\-]+')}(?![A-Za-z0-9])`, 'gi');
    for (const m of model.matchAll(re)) ranges.push([m.index, m.index + m[0].length]);
  }
  ranges.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else merged.push([...r]);
  }
  const nodes = [];
  let pos = 0;
  for (const [s, e] of merged) {
    if (s > pos) nodes.push(document.createTextNode(model.slice(pos, s)));
    nodes.push(h('mark', null, model.slice(s, e)));
    pos = e;
  }
  if (pos < model.length) nodes.push(document.createTextNode(model.slice(pos)));
  return nodes;
}

// Timed speaking drills. onProgress({ answered, stars: number[], total }) after each self-rating.
// onLeave(fn) registers cleanup to run when the user navigates away.
export function mount(container, items, { onProgress, speech, settings, onLeave, onActivity } = {}) {
  const stars = [];
  const rate = settings?.rate ?? 1;
  items.forEach((item, i) => {
    let timerId = null;
    let listening = null;
    let transcript = '';
    let finished = false;
    const timer = h('div', { class: 'timer', style: '--p:1' }, h('span', null, item.seconds));
    const transcriptEl = h('div', { class: 'transcript', hidden: true });
    const micMsg = h('p', { class: 'small', style: 'color:var(--err);margin:.3rem 0 0', hidden: true });
    const reveal = h('div', { hidden: true });
    const controls = h('div', { class: 'row' });
    const recBtn = speech?.canListen() ? h('button', { class: 'btn btn-sm', type: 'button' }, '🎙 Registra') : null;

    const stopAll = () => {
      if (timerId) { clearInterval(timerId); timerId = null; }
      if (listening) listening.stop();
    };
    onLeave?.(stopAll);

    const resetRecBtn = () => { if (recBtn) { recBtn.classList.remove('rec'); recBtn.textContent = '🎙 Registra'; } };

    const finish = async () => {
      if (finished) return;
      finished = true;
      stopAll();
      timer.classList.add('done');
      if (listening) {
        // Never block the model answer on the microphone.
        transcript = await Promise.race([listening.result, new Promise((r) => setTimeout(() => r(''), 1500))]);
        listening = null;
      }
      if (!transcript) transcriptEl.hidden = true;
      resetRecBtn();
      controls.querySelectorAll('button').forEach((b) => { b.disabled = true; });
      showModel();
    };

    const showModel = () => {
      reveal.hidden = false;
      const coverage = transcript ? keyPhraseCoverage(transcript, item.keyPhrases) : null;
      const starButtons = [1, 2, 3].map((n) => h('button', { type: 'button', 'aria-label': `${n} stelle`, onClick: () => {
        starButtons.forEach((b, idx) => b.classList.toggle('on', idx < n));
        stars[i] = n;
        onActivity?.();
        onProgress?.({ answered: stars.filter(Boolean).length, stars: [...stars], total: items.length });
      } }, '★'));
      reveal.replaceChildren(
        h('h3', null, 'Risposta modello'),
        h('div', { class: 'model' }, ...highlightNodes(item.model, item.keyPhrases)),
        h('div', { class: 'row', style: 'margin:.5rem 0' },
          h('button', { class: 'btn btn-sm', type: 'button', onClick: () => speech?.speak(item.model, { rate }) }, '🔊 Ascolta'),
          h('button', { class: 'btn btn-sm', type: 'button', onClick: () => speech?.speak(item.model, { rate: Math.max(0.6, rate - 0.25) }) }, '🐢 Lento')),
        coverage ? h('div', null,
          h('p', { class: 'small muted' }, `Hai detto: “${transcript}”`),
          h('div', { class: 'row' },
            ...coverage.found.map((k) => h('span', { class: 'chip key' }, `✓ ${k}`)),
            ...coverage.missing.map((k) => h('span', { class: 'chip missing' }, `✗ ${k}`))),
          h('p', { class: 'small' }, `Parole chiave usate: ${coverage.found.length}/${item.keyPhrases.length}`))
        : h('p', { class: 'small muted' }, 'Confronta quello che hai detto con il modello: hai usato le frasi evidenziate?'),
        h('div', { class: 'row' }, h('span', null, 'Come è andata?'), h('div', { class: 'stars' }, ...starButtons)),
        h('p', { class: 'small muted' }, 'Ora ripetilo ad alta voce due volte, la seconda senza leggere.'),
      );
    };

    const startTimer = (seconds) => {
      let left = seconds;
      timer.style.setProperty('--p', 1);
      timer.querySelector('span').textContent = left;
      timerId = setInterval(() => {
        left -= 1;
        timer.querySelector('span').textContent = left;
        timer.style.setProperty('--p', left / seconds);
        if (left <= 0) finish();
      }, 1000);
    };

    const startRecording = () => {
      if (listening || finished || !speech?.canListen()) return;
      transcriptEl.hidden = false;
      micMsg.hidden = true;
      transcriptEl.textContent = 'In ascolto…';
      recBtn.classList.add('rec');
      recBtn.textContent = '● Registrazione';
      listening = speech.listen({
        onInterim: (t) => { transcriptEl.textContent = t || 'In ascolto…'; },
        onError: (code) => {
          micMsg.hidden = false;
          micMsg.textContent = speech.errorMessage(code) + ' Puoi comunque rispondere a voce e confrontare con il modello.';
          transcriptEl.hidden = true;
          resetRecBtn();
          listening = null;
        },
      });
    };

    const startBtn = h('button', { class: 'btn btn-primary btn-sm', type: 'button', onClick: () => {
      startBtn.disabled = true; noTimerBtn.disabled = true;
      onActivity?.();
      startTimer(item.seconds);
      if (recBtn && settings?.mic !== false) startRecording();
    } }, `▶ Avvia (${item.seconds} s)`);
    const noTimerBtn = h('button', { class: 'btn btn-sm', type: 'button', onClick: () => {
      startBtn.disabled = true; noTimerBtn.disabled = true;
      onActivity?.();
      timer.querySelector('span').textContent = '∞';
      if (recBtn && settings?.mic !== false) startRecording();
    } }, 'Senza timer');
    const doneBtn = h('button', { class: 'btn btn-sm', type: 'button', onClick: finish }, '✔ Ho finito');
    if (recBtn) recBtn.addEventListener('click', startRecording);

    controls.append(startBtn, noTimerBtn, recBtn, doneBtn);
    container.append(h('div', { class: 'drill' },
      h('p', { class: 'small muted' }, `Situazione ${i + 1} di ${items.length}`),
      h('div', { class: 'prompt' }, item.prompt),
      h('div', { class: 'row', style: 'margin:.75rem 0' }, timer, h('div', null, controls,
        recBtn ? h('p', { class: 'small muted', style: 'margin:.4rem 0 0' }, 'Il browser chiederà il permesso del microfono. L’audio non viene salvato.') : null,
        micMsg)),
      transcriptEl,
      reveal));
  });
}

import { h, escapeHTML } from '../../dom.js';
import { keyPhraseCoverage, normalize } from '../../grading.js';

function highlight(model, keyPhrases) {
  let html = escapeHTML(model);
  for (const k of keyPhrases) {
    const re = new RegExp(escapeHTML(k).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/['\u2019]/g, "['\u2019]"), 'i');
    html = html.replace(re, (m) => `<mark>${m}</mark>`);
  }
  return html;
}

// Timed speaking drills. onProgress({ answered, stars: number[], total }) after each self-rating.
export function mount(container, items, { onProgress, speech, settings } = {}) {
  const stars = [];
  const rate = settings?.rate ?? 1;
  items.forEach((item, i) => {
    let timerId = null;
    let listening = null;
    let transcript = '';
    const timer = h('div', { class: 'timer', style: '--p:1' }, h('span', null, item.seconds));
    const transcriptEl = h('div', { class: 'transcript', hidden: true });
    const reveal = h('div', { hidden: true });
    const controls = h('div', { class: 'row' });
    const recBtn = speech?.canListen() ? h('button', { class: 'btn btn-sm', type: 'button' }, '🎙 Registra') : null;

    const stopAll = () => {
      if (timerId) { clearInterval(timerId); timerId = null; }
      if (listening) { listening.stop(); }
    };

    const finish = async () => {
      stopAll();
      timer.classList.add('done');
      if (listening) { transcript = await listening.result; listening = null; }
      if (!transcript) transcriptEl.hidden = true;
      if (recBtn) { recBtn.classList.remove('rec'); recBtn.textContent = '🎙 Registra'; }
      controls.querySelectorAll('button').forEach((b) => { b.disabled = true; });
      showModel();
    };

    const showModel = () => {
      reveal.hidden = false;
      const coverage = transcript ? keyPhraseCoverage(transcript, item.keyPhrases) : null;
      const starButtons = [1, 2, 3].map((n) => h('button', { type: 'button', 'aria-label': `${n} stelle`, onClick: () => {
        starButtons.forEach((b, idx) => b.classList.toggle('on', idx < n));
        stars[i] = n;
        onProgress?.({ answered: stars.filter(Boolean).length, stars: [...stars], total: items.length });
      } }, '★'));
      reveal.replaceChildren(
        h('h3', null, 'Risposta modello'),
        h('div', { class: 'model', html: highlight(item.model, item.keyPhrases) }),
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
      );
      if (!transcript && item.keyPhrases.length) {
        // Let the learner repeat the model aloud (shadowing) after reading it.
        reveal.append(h('p', { class: 'small muted' }, 'Ora ripetilo ad alta voce due volte, la seconda senza leggere.'));
      }
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

    const startBtn = h('button', { class: 'btn btn-primary btn-sm', type: 'button', onClick: () => {
      startBtn.disabled = true; noTimerBtn.disabled = true;
      startTimer(item.seconds);
      if (recBtn && settings?.mic !== false) startRecording();
    } }, `▶ Avvia (${item.seconds} s)`);
    const noTimerBtn = h('button', { class: 'btn btn-sm', type: 'button', onClick: () => {
      startBtn.disabled = true; noTimerBtn.disabled = true;
      timer.querySelector('span').textContent = '∞';
      if (recBtn && settings?.mic !== false) startRecording();
    } }, 'Senza timer');
    const doneBtn = h('button', { class: 'btn btn-sm', type: 'button', onClick: finish }, '✔ Ho finito');

    const startRecording = () => {
      if (listening || !speech?.canListen()) return;
      transcriptEl.hidden = false;
      transcriptEl.textContent = 'In ascolto…';
      recBtn.classList.add('rec');
      recBtn.textContent = '● Registrazione';
      listening = speech.listen({ onInterim: (t) => { transcriptEl.textContent = t || 'In ascolto…'; } });
    };
    if (recBtn) recBtn.addEventListener('click', startRecording);

    controls.append(startBtn, noTimerBtn, recBtn, doneBtn);
    container.append(h('div', { class: 'drill' },
      h('p', { class: 'small muted' }, `Situazione ${i + 1} di ${items.length}`),
      h('div', { class: 'prompt' }, item.prompt),
      h('div', { class: 'row', style: 'margin:.75rem 0' }, timer, h('div', null, controls,
        recBtn ? h('p', { class: 'small muted', style: 'margin:.4rem 0 0' }, 'Il browser chiederà il permesso del microfono. L’audio non viene salvato.') : null)),
      transcriptEl,
      reveal));
  });
}

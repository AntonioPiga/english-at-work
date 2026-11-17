// Tiny DOM helpers and date utilities shared by the views.

export function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  if (attrs && typeof attrs === 'object' && !(attrs instanceof Node)) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    }
  } else if (attrs !== undefined && attrs !== null) {
    children.unshift(attrs);
  }
  append(el, children);
  return el;
}

export function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

export function todayKey(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function dayDiff(a, b) {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}

export function updateStreak(streak, today = todayKey()) {
  if (!streak?.last) return { last: today, days: 1 };
  const diff = dayDiff(streak.last, today);
  if (diff <= 0) return { last: today, days: streak.days };
  if (diff === 1) return { last: today, days: streak.days + 1 };
  return { last: today, days: 1 };
}

// Streak as it should be displayed: 0 once a day has been skipped.
export function currentStreak(streak, today = todayKey()) {
  if (!streak?.last) return 0;
  return dayDiff(streak.last, today) <= 1 ? streak.days : 0;
}

export function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return String(iso);
  }
}

// { retry: true } offers a reload; { back: '#/x', label } offers a link away.
export function errorView(message, { retry = false, back = '#/', label = 'Torna al corso' } = {}) {
  return h('div', { class: 'error', role: 'alert' }, message, ' ',
    retry ? h('a', { href: location.hash || '#/', onClick: (e) => { e.preventDefault(); location.reload(); } }, 'Riprova') : h('a', { href: back }, label));
}

export function levelBadge(level) {
  return h('span', { class: `badge badge-level ${level}` }, level);
}

export function pct(correct, total) {
  return total ? Math.round((correct / total) * 100) : 0;
}

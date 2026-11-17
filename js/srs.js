// Leitner spaced repetition: 5 boxes, intervals in days. Pure functions.

export const INTERVALS = [0, 1, 3, 7, 14];
export const DAY = 24 * 60 * 60 * 1000;
const MAX_BOX = INTERVALS.length;

export function startOfDay(ts) {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function addDays(ts, n) {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n).getTime();
}

// Returns the new SRS entry. Intervals > 0 are due at local midnight, so an evening review is due the next morning.
export function review(card, correct, now) {
  const box = correct ? Math.min((card?.box ?? 1) + 1, MAX_BOX) : 1;
  const interval = INTERVALS[box - 1];
  const due = interval === 0 ? now : addDays(now, interval);
  return { box, due, last: now, intro: card?.intro ?? now };
}

// Due cards first (oldest due first), then unseen cards up to the daily budget (max new per local day).
export function buildSession(cardIds, srsState, now, maxNew = 20) {
  const due = cardIds
    .filter((id) => srsState[id] && srsState[id].due <= now)
    .sort((a, b) => srsState[a].due - srsState[b].due);
  const today = startOfDay(now);
  const introducedToday = cardIds.filter((id) => srsState[id] && (srsState[id].intro ?? 0) >= today).length;
  const budget = Math.max(0, maxNew - introducedToday);
  const fresh = cardIds.filter((id) => !srsState[id]).slice(0, budget);
  return [...due, ...fresh];
}

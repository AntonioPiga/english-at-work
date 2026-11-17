// Leitner spaced repetition: 5 boxes, intervals in days. Pure functions.

export const INTERVALS = [0, 1, 3, 7, 14];
export const DAY = 24 * 60 * 60 * 1000;
const MAX_BOX = INTERVALS.length;

export function review(card, correct, now) {
  const box = correct ? Math.min((card?.box ?? 1) + 1, MAX_BOX) : 1;
  const due = now + INTERVALS[box - 1] * DAY;
  return { box, due, last: now };
}

export function buildSession(cardIds, srsState, now, maxNew = 20) {
  const due = cardIds
    .filter((id) => srsState[id] && srsState[id].due <= now)
    .sort((a, b) => srsState[a].due - srsState[b].due);
  const fresh = cardIds.filter((id) => !srsState[id]).slice(0, maxNew);
  return [...due, ...fresh];
}

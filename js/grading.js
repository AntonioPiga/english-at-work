// Text normalisation and lenient comparison helpers for answers.

const CONTRACTIONS = [
  [/\bcan't\b/g, 'cannot'],
  [/\bwon't\b/g, 'will not'],
  [/\bshan't\b/g, 'shall not'],
  [/n't\b/g, ' not'],
  [/\b(i)'m\b/g, '$1 am'],
  [/'re\b/g, ' are'],
  [/'ve\b/g, ' have'],
  [/'ll\b/g, ' will'],
  [/'d\b/g, ' would'],
  [/\blet's\b/g, 'let us'],
  [/'s\b/g, ' is'],
];

export function normalize(text) {
  let t = String(text ?? '').toLowerCase().replace(/[‘’ʼ]/g, "'").replace(/[“”]/g, '"');
  for (const [re, rep] of CONTRACTIONS) t = t.replace(re, rep);
  t = t.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  return t;
}

export function keyPhraseCoverage(answer, keyPhrases) {
  const text = ` ${normalize(answer)} `;
  const found = [];
  const missing = [];
  for (const phrase of keyPhrases) {
    (text.includes(` ${normalize(phrase)} `) ? found : missing).push(phrase);
  }
  const ratio = keyPhrases.length === 0 ? 1 : found.length / keyPhrases.length;
  return { found, missing, ratio };
}

export function checkGap(input, answers) {
  const n = normalize(input);
  return answers.some((a) => normalize(a) === n);
}

export function checkReorder(words, answer) {
  return normalize(words.join(' ')) === normalize(answer);
}

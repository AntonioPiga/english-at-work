#!/usr/bin/env node
// Validates every JSON file under content/ against the course schema (spec §7 and Global Constraints).
// Usage: node scripts/validate-content.mjs   (exit 1 on errors)
import { readFile, readdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { normalize as norm } from '../js/grading.js';

const LEVELS = ['B1', 'B2', 'C1'];
const TRACKS = ['calls', 'emails', 'presentations'];
const WRITE_TRACKS = ['emails', 'presentations'];

const isStr = (v) => typeof v === 'string' && v.trim().length > 0;
const isInt = (v) => Number.isInteger(v);
const words = (s) => String(s).trim().split(/\s+/).filter(Boolean).length;

function checkQuestion(q, i, where, errs) {
  const p = `${where}.quiz[${i}]`;
  if (!isStr(q.q)) errs.push(`${p}.q missing`);
  if (!Array.isArray(q.options) || q.options.length !== 4 || !q.options.every(isStr)) errs.push(`${p}.options must have exactly 4 non-empty strings`);
  if (!isInt(q.answer) || q.answer < 0 || q.answer >= (q.options?.length ?? 0)) errs.push(`${p}.answer out of range`);
  if (!isStr(q.why)) errs.push(`${p}.why missing`);
}

export function validateModule(m) {
  const errs = [];
  const w = m?.id ?? 'module';
  if (!m || typeof m !== 'object') return ['module is not an object'];
  if (!isStr(m.id)) errs.push(`${w}: id missing`);
  if (!TRACKS.includes(m.track)) errs.push(`${w}: track must be one of ${TRACKS.join(', ')}`);
  if (isStr(m.id) && isStr(m.track) && !m.id.startsWith(`${m.track}-`)) errs.push(`${w}: id must start with "${m.track}-"`);
  if (!isInt(m.order) || m.order < 1) errs.push(`${w}: order must be a positive integer`);
  if (!isStr(m.title)) errs.push(`${w}: title missing`);
  if (!LEVELS.includes(m.level)) errs.push(`${w}: level must be B1, B2 or C1`);
  if (!isInt(m.minutes) || m.minutes < 5) errs.push(`${w}: minutes must be an integer >= 5`);

  const g = m.grammar;
  if (!g || typeof g !== 'object') errs.push(`${w}: grammar missing`);
  else {
    if (!isStr(g.title)) errs.push(`${w}: grammar.title missing`);
    if (!isStr(g.explanation)) errs.push(`${w}: grammar.explanation missing`);
    else if (words(g.explanation) > 200) errs.push(`${w}: grammar.explanation exceeds 200 words (${words(g.explanation)})`);
    if (!Array.isArray(g.examples) || g.examples.length < 4 || g.examples.length > 8) errs.push(`${w}: grammar.examples must have 4-8 items`);
    else g.examples.forEach((ex, i) => { if (!isStr(ex.en)) errs.push(`${w}: grammar.examples[${i}].en missing`); });
    if (!isStr(g.italianTrap)) errs.push(`${w}: grammar.italianTrap missing`);
  }

  if (!Array.isArray(m.phrases) || m.phrases.length < 8 || m.phrases.length > 12) errs.push(`${w}: phrases must have 8-12 items`);
  else m.phrases.forEach((p, i) => {
    if (!isStr(p.en)) errs.push(`${w}: phrases[${i}].en missing`);
    if (!isStr(p.it)) errs.push(`${w}: phrases[${i}].it missing`);
    if (!isStr(p.when)) errs.push(`${w}: phrases[${i}].when missing`);
  });

  if (!Array.isArray(m.quiz) || m.quiz.length < 6 || m.quiz.length > 8) errs.push(`${w}: quiz must have 6-8 questions`);
  else m.quiz.forEach((q, i) => checkQuestion(q, i, w, errs));

  const gaps = Array.isArray(m.gapfill) ? m.gapfill : [];
  const reorders = Array.isArray(m.reorder) ? m.reorder : [];
  if (gaps.length + reorders.length < 4 || gaps.length + reorders.length > 6) errs.push(`${w}: gapfill + reorder must total 4-6 items (got ${gaps.length + reorders.length})`);
  gaps.forEach((gp, i) => {
    if (!isStr(gp.text) || gp.text.split('___').length !== 2) errs.push(`${w}: gapfill[${i}].text must contain exactly one ___`);
    if (!Array.isArray(gp.answers) || gp.answers.length === 0 || !gp.answers.every(isStr)) errs.push(`${w}: gapfill[${i}].answers must be a non-empty string array`);
    if (!isStr(gp.hint)) errs.push(`${w}: gapfill[${i}].hint missing`);
  });
  reorders.forEach((r, i) => {
    if (!Array.isArray(r.words) || r.words.length < 3) errs.push(`${w}: reorder[${i}].words needs >= 3 words`);
    if (!isStr(r.answer)) errs.push(`${w}: reorder[${i}].answer missing`);
    else if (Array.isArray(r.words) && norm(r.words.join(' ')) !== norm(r.answer)) errs.push(`${w}: reorder[${i}] words do not form the answer`);
    if (r.answers !== undefined) {
      if (!Array.isArray(r.answers) || !r.answers.every(isStr)) errs.push(`${w}: reorder[${i}].answers must be a string array`);
      else if (Array.isArray(r.words)) {
        const bag = norm(r.words.join(' ')).split(' ').sort().join(' ');
        r.answers.forEach((a, j) => { if (norm(a).split(' ').sort().join(' ') !== bag) errs.push(`${w}: reorder[${i}] alternative ${j} does not use the same words`); });
      }
    }
  });

  if (!Array.isArray(m.fluency) || m.fluency.length < 3 || m.fluency.length > 4) errs.push(`${w}: fluency must have 3-4 drills`);
  else m.fluency.forEach((f, i) => {
    const p = `${w}: fluency[${i}]`;
    if (!isStr(f.prompt)) errs.push(`${p}.prompt missing`);
    if (!isInt(f.seconds) || f.seconds < 15 || f.seconds > 120) errs.push(`${p}.seconds must be 15-120`);
    if (!isStr(f.model)) errs.push(`${p}.model missing`);
    if (!Array.isArray(f.keyPhrases) || f.keyPhrases.length < 3 || f.keyPhrases.length > 6) errs.push(`${p}.keyPhrases must have 3-6 items`);
    else if (isStr(f.model)) {
      const model = ` ${norm(f.model)} `;
      f.keyPhrases.forEach((k) => { if (!model.includes(` ${norm(k)} `)) errs.push(`${p}.keyPhrases "${k}" not found in model`); });
    }
  });

  if (m.write !== undefined) {
    if (!WRITE_TRACKS.includes(m.track)) errs.push(`${w}: write allowed only in ${WRITE_TRACKS.join('/')}`);
    else if (!Array.isArray(m.write) || m.write.length < 1 || m.write.length > 2) errs.push(`${w}: write must have 1-2 prompts`);
    else m.write.forEach((x, i) => {
      if (!isStr(x.prompt)) errs.push(`${w}: write[${i}].prompt missing`);
      if (!isStr(x.model)) errs.push(`${w}: write[${i}].model missing`);
      if (!Array.isArray(x.checklist) || x.checklist.length < 2 || !x.checklist.every(isStr)) errs.push(`${w}: write[${i}].checklist needs >= 2 items`);
      if (x.keyPhrases !== undefined && (!Array.isArray(x.keyPhrases) || !x.keyPhrases.every(isStr))) errs.push(`${w}: write[${i}].keyPhrases must be strings`);
    });
  }
  return errs;
}

export function validateDeck(d) {
  const errs = [];
  const w = d?.id ?? 'deck';
  if (!d || typeof d !== 'object') return ['deck is not an object'];
  if (!isStr(d.id)) errs.push('deck id missing');
  if (!isStr(d.title)) errs.push(`${w}: title missing`);
  if (!isStr(d.description)) errs.push(`${w}: description missing`);
  if (!Array.isArray(d.cards) || d.cards.length < 2) errs.push(`${w}: cards must have >= 2 items`);
  else {
    const seen = new Set();
    d.cards.forEach((c, i) => {
      if (!isStr(c.id)) errs.push(`${w}: cards[${i}].id missing`);
      else if (seen.has(c.id)) errs.push(`${w}: duplicate card id ${c.id}`);
      else seen.add(c.id);
      if (!isStr(c.front)) errs.push(`${w}: cards[${i}].front missing`);
      if (!isStr(c.back)) errs.push(`${w}: cards[${i}].back missing`);
      if (!isStr(c.example)) errs.push(`${w}: cards[${i}].example missing`);
    });
  }
  return errs;
}

export function validatePlacement(p) {
  const errs = [];
  if (!p || !Array.isArray(p.questions)) return ['placement.questions must be an array'];
  if (p.questions.length !== 0 && p.questions.length !== 20) errs.push(`placement must have exactly 20 questions (got ${p.questions.length})`);
  if (p.questions.length === 20) {
    const count = (l) => p.questions.filter((q) => q.level === l).length;
    if (count('B1') !== 7 || count('B2') !== 7 || count('C1') !== 6) errs.push(`placement level split must be 7 B1 / 7 B2 / 6 C1 (got ${count('B1')}/${count('B2')}/${count('C1')})`);
  }
  p.questions.forEach((q, i) => {
    checkQuestion(q, i, 'placement', errs);
    if (!LEVELS.includes(q.level)) errs.push(`placement.quiz[${i}].level must be B1, B2 or C1`);
  });
  return errs;
}

export function validateIndex(idx, contentDirUrl) {
  const errs = [];
  if (!idx || !Array.isArray(idx.tracks)) return ['index.tracks must be an array'];
  const base = fileURLToPath(contentDirUrl);
  const exists = (rel) => { try { return accessSync(join(base, rel)); } catch { return false; } };
  idx.tracks.forEach((t) => {
    if (!TRACKS.includes(t.id)) errs.push(`index: unknown track ${t.id}`);
    if (!isStr(t.title) || !isStr(t.subtitle)) errs.push(`index: track ${t.id} needs title and subtitle`);
    if (!Array.isArray(t.modules)) { errs.push(`index: track ${t.id} modules missing`); return; }
    t.modules.forEach((m) => {
      if (!isStr(m.id) || !isStr(m.file) || !isStr(m.title) || !LEVELS.includes(m.level) || !isInt(m.minutes)) errs.push(`index: module entry ${m.id ?? '?'} incomplete`);
      if (isStr(m.file) && !exists(m.file)) errs.push(`index: file not found ${m.file}`);
    });
  });
  (idx.decks ?? []).forEach((d) => {
    if (!isStr(d.id) || !isStr(d.file) || !isStr(d.title) || !isStr(d.description)) errs.push(`index: deck entry ${d.id ?? '?'} incomplete`);
    if (isStr(d.file) && !exists(d.file)) errs.push(`index: file not found ${d.file}`);
  });
  if (!isStr(idx.placement) || !exists(idx.placement)) errs.push('index: placement file missing');
  return errs;
}

import { accessSync as _accessSync } from 'node:fs';
function accessSync(p) { _accessSync(p); return true; }

async function readJSON(url) {
  return JSON.parse(await readFile(url, 'utf8'));
}

export async function validateTree(contentDirUrl) {
  const errs = [];
  let idx;
  try { idx = await readJSON(new URL('index.json', contentDirUrl)); } catch (e) { return [`index.json unreadable: ${e.message}`]; }
  errs.push(...validateIndex(idx, contentDirUrl));
  if (errs.length) return errs;

  const moduleIds = new Set();
  const referenced = new Set();
  for (const t of idx.tracks) {
    for (const [pos, entry] of t.modules.entries()) {
      referenced.add(entry.file);
      let m;
      try { m = await readJSON(new URL(entry.file, contentDirUrl)); } catch (e) { errs.push(`${entry.file}: ${e.message}`); continue; }
      errs.push(...validateModule(m).map((e) => `${entry.file}: ${e}`));
      if (m.id !== entry.id) errs.push(`${entry.file}: id ${m.id} differs from index ${entry.id}`);
      if (m.track !== t.id) errs.push(`${entry.file}: track ${m.track} differs from parent ${t.id}`);
      if (m.order !== pos + 1) errs.push(`${entry.file}: order ${m.order} differs from position ${pos + 1}`);
      if (m.level !== entry.level) errs.push(`${entry.file}: level differs from index`);
      if (m.title !== entry.title) errs.push(`${entry.file}: title differs from index`);
      if (m.minutes !== entry.minutes) errs.push(`${entry.file}: minutes differs from index`);
      if (moduleIds.has(m.id)) errs.push(`duplicate module id ${m.id}`);
      moduleIds.add(m.id);
    }
  }
  const cardIds = new Set();
  for (const entry of idx.decks ?? []) {
    referenced.add(entry.file);
    let d;
    try { d = await readJSON(new URL(entry.file, contentDirUrl)); } catch (e) { errs.push(`${entry.file}: ${e.message}`); continue; }
    errs.push(...validateDeck(d).map((e) => `${entry.file}: ${e}`));
    if (d.id !== entry.id) errs.push(`${entry.file}: id ${d.id} differs from index ${entry.id}`);
    for (const c of d.cards ?? []) {
      if (cardIds.has(c.id)) errs.push(`duplicate card id across decks: ${c.id}`);
      cardIds.add(c.id);
    }
  }
  try {
    const p = await readJSON(new URL(idx.placement, contentDirUrl));
    errs.push(...validatePlacement(p).map((e) => `${idx.placement}: ${e}`));
  } catch (e) { errs.push(`${idx.placement}: ${e.message}`); }

  // Every JSON on disk under tracks/ and decks/ must be referenced.
  const base = fileURLToPath(contentDirUrl);
  for (const dir of ['tracks', 'decks']) {
    const files = await listJSON(join(base, dir), dir);
    for (const f of files) if (!referenced.has(f)) errs.push(`unreferenced file ${f}`);
  }
  return errs;
}

async function listJSON(absDir, rel) {
  let entries = [];
  try { entries = await readdir(absDir, { withFileTypes: true }); } catch { return []; }
  const out = [];
  for (const e of entries) {
    if (e.isDirectory()) out.push(...(await listJSON(join(absDir, e.name), `${rel}/${e.name}`)));
    else if (e.name.endsWith('.json')) out.push(`${rel}/${e.name}`);
  }
  return out;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const errors = await validateTree(new URL('../content/', import.meta.url));
  if (errors.length) { console.error(errors.join('\n')); console.error(`\n${errors.length} error(s)`); process.exit(1); }
  console.log('content OK');
}

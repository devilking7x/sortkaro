'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../app.js');

// --- dataset ---------------------------------------------------------------
test('dataset: 73 items, 6 real categories, no duplicates', () => {
  assert.equal(S.ITEMS.length, 73);
  const cats = new Set(S.ITEMS.map((it) => it.cat));
  assert.deepEqual([...cats].sort(), ['dry', 'ewaste', 'hazardous', 'other', 'sanitary', 'wet']);
  const names = S.ITEMS.map((it) => it.name);
  assert.equal(new Set(names).size, names.length, 'duplicate item names');
  for (const it of S.ITEMS) {
    assert.ok(it.name && it.hi && it.why && it.tip, it.name + ' missing a field');
    assert.ok(S.CATEGORIES[it.cat], it.name + ' has bad category ' + it.cat);
  }
});

test('dataset: every category has at least 6 items', () => {
  for (const cat of ['wet', 'dry', 'hazardous', 'ewaste', 'sanitary', 'other']) {
    assert.ok(S.itemsByCategory(cat).length >= 6, cat + ' too small');
  }
});

// --- classify: exact + alias ----------------------------------------------
test('classify: exact dataset names', () => {
  assert.equal(S.classify('newspaper').cat, 'dry');
  assert.equal(S.classify('banana peel').cat, 'wet');
  assert.equal(S.classify('used batteries').cat, 'hazardous');
  assert.equal(S.classify('old mobile phone').cat, 'ewaste');
  assert.equal(S.classify('sanitary pads').cat, 'sanitary');
  assert.equal(S.classify('coconut shell').cat, 'other');
  assert.equal(S.classify('old laptop').cat, 'ewaste');
  assert.equal(S.classify('milk packet').cat, 'dry');
});

test('classify: Hindi names and aliases work', () => {
  assert.equal(S.classify('akhbaar').cat, 'dry');
  assert.equal(S.classify('kele ka chilka').cat, 'wet');
  assert.equal(S.classify('mobile').cat, 'ewaste');
  assert.equal(S.classify('battery').cat, 'hazardous');
  assert.equal(S.classify('dawai').cat, 'hazardous');
  assert.equal(S.classify('chappal').cat, 'other');
  assert.equal(S.classify('gatta').cat, 'dry');
});

test('classify: case, spaces and punctuation do not matter', () => {
  assert.equal(S.classify('  Newspaper ').cat, 'dry');
  assert.equal(S.classify('NEWSPAPER').cat, 'dry');
  assert.equal(S.classify('banana peel.').cat, 'wet');
  assert.equal(S.classify('').cat, 'unknown');
  assert.equal(S.classify('   ').cat, 'unknown');
  assert.equal(S.classify(null).cat, 'unknown');
});

test('classify: tricky pairs are not confused', () => {
  // CFL (mercury) is hazardous; LED (circuit board) is e-waste.
  assert.equal(S.classify('cfl bulb').cat, 'hazardous');
  assert.equal(S.classify('led bulb').cat, 'ewaste');
  assert.equal(S.classify('tube light').cat, 'hazardous');
  // Paint tin is hazardous, tin can is dry.
  assert.equal(S.classify('paint tin').cat, 'hazardous');
  assert.equal(S.classify('tin can').cat, 'dry');
  // Milk packet is dry plastic; chips packet is check-locally.
  assert.equal(S.classify('milk packet').cat, 'dry');
  assert.equal(S.classify('chips packets').cat, 'other');
});

// --- classify: held-out generalisation --------------------------------------
test('held-out evaluation: 20 unseen item names, accuracy >= 90%', () => {
  const r = S.evaluateHeldOut();
  console.log(`held-out: ${r.correct}/${r.total} = ${(r.accuracy * 100).toFixed(0)}%`);
  if (r.misses.length) console.log('misses:', JSON.stringify(r.misses));
  assert.ok(r.accuracy >= 0.9, `held-out accuracy ${r.accuracy} below 0.9`);
});

test('held-out: every single held-out item is correct', () => {
  const r = S.evaluateHeldOut();
  assert.equal(r.misses.length, 0, 'misses: ' + JSON.stringify(r.misses));
});

// --- search ----------------------------------------------------------------
test('search: filters by English, Hindi and category', () => {
  assert.ok(S.searchItems('bottle').length >= 4);
  assert.ok(S.searchItems('akhbaar').length >= 1);
  assert.ok(S.searchItems('battery').length >= 1);
  assert.equal(S.searchItems('zzzznothing').length, 0);
  assert.equal(S.searchItems('').length, 73);
});

// --- quiz ------------------------------------------------------------------
test('quiz: 10 distinct items, grading is exact', () => {
  let seed = 42;
  const rng = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const quiz = S.makeQuiz(10, rng);
  assert.equal(quiz.length, 10);
  assert.equal(new Set(quiz.map((q) => q.name)).size, 10);
  const allCorrect = quiz.map((q) => q.answer);
  assert.equal(S.gradeQuiz(quiz, allCorrect).correct, 10);
  const allWrong = quiz.map((q) => (q.answer === 'wet' ? 'dry' : 'wet'));
  assert.equal(S.gradeQuiz(quiz, allWrong).correct, 0);
  const half = quiz.map((q, i) => (i % 2 === 0 ? q.answer : 'dry'));
  const g = S.gradeQuiz(quiz, half);
  assert.ok(g.correct >= 0 && g.correct <= 10);
  assert.equal(g.detail.length, 10);
});

#!/usr/bin/env node
/*
 * Claim validator for "The House Always Wins".
 * Fails the build (exit 1) if any claim is malformed or missing a source.
 * Draft claims (status:"draft") pass but are reported as warnings.
 *
 * Run: node tools/validate.js   (or: npm run validate)
 */
'use strict';
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'claims.json');
const REQUIRED = ['id', 'category', 'claim', 'answer', 'verdict', 'explanation', 'sourceUrl', 'sourcePublisher'];
const errors = [];
const warnings = [];

let data;
try {
  data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
} catch (e) {
  console.error('✗ Could not read/parse data/claims.json:', e.message);
  process.exit(1);
}

if (!Array.isArray(data) || data.length === 0) {
  console.error('✗ claims.json must be a non-empty array.');
  process.exit(1);
}

const ids = new Set();
const isHttp = (u) => typeof u === 'string' && /^https?:\/\/.+/i.test(u);
const nonEmpty = (v) => typeof v === 'string' && v.trim().length > 0;

data.forEach((c, i) => {
  const at = `claim[${i}]${c && c.id ? ' "' + c.id + '"' : ''}`;

  REQUIRED.forEach((f) => {
    if (!(f in c) || c[f] === null || c[f] === '') errors.push(`${at}: missing required field "${f}"`);
  });

  if (c.id != null) {
    if (ids.has(c.id)) errors.push(`${at}: duplicate id`);
    ids.add(c.id);
    if (!/^[a-z0-9-]+$/.test(String(c.id))) errors.push(`${at}: id should be kebab-case (a-z, 0-9, -)`);
  }

  const ans = String(c.answer);
  if (ans !== 'true' && ans !== 'false') {
    errors.push(`${at}: answer must be "true" or "false" (got ${JSON.stringify(c.answer)})`);
  } else {
    const expected = ans === 'true' ? 'Fact' : 'Fiction';
    if (c.verdict !== expected) errors.push(`${at}: verdict "${c.verdict}" must be "${expected}" for answer ${ans}`);
  }

  if (!isHttp(c.sourceUrl)) errors.push(`${at}: sourceUrl must be an http(s) URL — every claim needs a citation`);
  if (!nonEmpty(c.claim)) errors.push(`${at}: claim text is empty`);
  if (!nonEmpty(c.explanation)) errors.push(`${at}: explanation is empty`);

  if (c.status === 'draft' || (typeof c.explanation === 'string' && c.explanation.startsWith('DRAFT'))) {
    warnings.push(`${at}: still DRAFT — replace with fact-checked copy before launch`);
  }
});

console.log(`Checked ${data.length} claims · ${ids.size} unique ids · ${errors.length} error(s) · ${warnings.length} draft warning(s)`);
if (warnings.length) {
  console.log('\nDraft claims (not blocking):');
  warnings.forEach((w) => console.log('  ⚠ ' + w));
}
if (errors.length) {
  console.error('\nERRORS (blocking):');
  errors.forEach((e) => console.error('  ✗ ' + e));
  process.exit(1);
}
console.log('\n✓ All claims valid.');

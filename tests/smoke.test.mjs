// Smoke test for job_matching app (added 2026-06-21, Lane 3 of grade recovery).
// Uses Node 22 built-in test runner — no test framework dependency.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));

test('app.js has no syntax errors', () => {
  execSync(`node --check "${join(projectRoot, 'app.js')}"`, { stdio: 'pipe' });
});

test('index.html exists and references app.js', () => {
  const html = readFileSync(join(projectRoot, 'index.html'), 'utf-8');
  assert.match(html, /app\.js/, 'index.html should reference app.js');
});

test('LICENSE exists', () => {
  assert.ok(existsSync(join(projectRoot, 'LICENSE')), 'LICENSE should be present');
});

test('sample_candidates.csv is valid CSV', () => {
  const raw = readFileSync(join(projectRoot, 'sample_candidates.csv'), 'utf-8');
  const lines = raw.trim().split('\n');
  assert.ok(lines.length >= 2, 'should have at least header + 1 row');
  const header = lines[0];
  assert.ok(header.includes('name') || header.includes('id'),
    'CSV should have a name or id column');
});

test('sample_jobs.csv is valid CSV', () => {
  const raw = readFileSync(join(projectRoot, 'sample_jobs.csv'), 'utf-8');
  const lines = raw.trim().split('\n');
  assert.ok(lines.length >= 2, 'should have at least header + 1 row');
  const header = lines[0];
  assert.ok(header.includes('title') || header.includes('id'),
    'CSV should have a title or id column');
});

test('README references the documented public files', () => {
  const md = readFileSync(join(projectRoot, 'README.md'), 'utf-8');
  assert.match(md, /index\.html/, 'README should reference index.html');
  assert.match(md, /app\.js/, 'README should reference app.js');
  assert.match(md, /LICENSE/, 'README should mention LICENSE');
});

test('CHANGELOG.md exists and is non-empty', () => {
  const p = join(projectRoot, 'CHANGELOG.md');
  assert.ok(existsSync(p), 'CHANGELOG.md should exist');
  const raw = readFileSync(p, 'utf-8');
  assert.ok(raw.trim().length > 100, 'CHANGELOG.md should have meaningful content');
});

test('DEPLOYMENT.md exists and references GitHub Pages', () => {
  const raw = readFileSync(join(projectRoot, 'DEPLOYMENT.md'), 'utf-8');
  assert.match(raw, /github\.io|Pages|Pages/i, 'DEPLOYMENT.md should reference GitHub Pages');
});
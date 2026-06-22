# Changelog

All notable changes to `job_matching` are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- GitHub Actions CI workflow (`.github/workflows/js-syntax-check.yml`)
  running `node --check app.js` + the Node smoke test suite on every push.
- LICENSE (MIT, copyright EzraAir555).
- Smoke test suite under `tests/smoke.test.mjs` — syntax check, sample CSV
  schema validation, LICENSE presence.

## [0.1.0] — initial commit

- Static HTML/JS dashboard.
- DuckDB-WASM for in-browser data processing.
- Transformers.js for sentence embeddings.
- Cosine similarity matching between candidates and jobs.
- Sample CSV fixtures (`sample_candidates.csv`, `sample_jobs.csv`).
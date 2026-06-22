# Job Matching Dashboard

A static, browser-based job matching dashboard that uses **duckdb-wasm** for data processing and **sentence embeddings** for candidate-job matching.

## Architecture

- **Frontend**: Vanilla JavaScript + HTML/CSS (no build step required)
- **Database**: DuckDB-WASM (runs entirely in the browser)
- **Embeddings**: Transformers.js (sentence-transformers in the browser)
- **Hosting**: GitHub Pages (static site)
- **Data Input**: CSV/Excel file upload

## Features

- Upload candidate profiles (CSV/Excel)
- Upload job postings (CSV/Excel)
- Automatic sentence embedding generation
- Cosine similarity matching between candidates and jobs
- Interactive dashboard with filtering and sorting
- Export matched results

## Quick Start

1. Open `index.html` in your browser (or visit the GitHub Pages URL)
2. Upload your candidate data
3. Upload your job postings data
4. Click "Generate Matches"
5. Review and export results

## Data Format

### Candidates CSV
```csv
id,name,skills,experience_years,resume_text
1,John Doe,"Python,SQL,Machine Learning",5,"Experienced data scientist..."
```

### Jobs CSV
```csv
id,title,required_skills,description,experience_required
1,Data Scientist,"Python,Machine Learning","Build ML models...",3
```

## Local Development

```bash
# Serve locally (required for DuckDB-WASM)
python3 -m http.server 8000
# Visit http://localhost:8000
```

## Deployment

Push to GitHub and enable GitHub Pages:
```bash
git add .
git commit -m "Initial commit"
git push -u origin main
```

Then go to Repository Settings → Pages → Select `main` branch.

## Tech Stack

- [DuckDB-WASM](https://duckdb.org/docs/api/wasm/overview.html) - In-browser SQL database
- [Transformers.js](https://huggingface.co/docs/transformers.js) - Browser-based embeddings
- [SheetJS](https://sheetjs.com/) - Excel/CSV parsing
- [GitHub Pages](https://pages.github.com/) - Static hosting

## Application API (app.js)

The app exposes a single class, `JobMatchingApp`, which encapsulates the
end-to-end matching workflow.

### Lifecycle

1. `new JobMatchingApp()` — constructor calls `init()`.
2. `init()` — attaches DOM event listeners and asynchronously initializes
   DuckDB-WASM + the embedding model.
3. User uploads `candidates.csv` and `jobs.csv` via the file inputs.
4. App embeds both datasets with Transformers.js (cached after first run).
5. User clicks "Generate Matches" — DuckDB SQL computes cosine similarity,
   returns top-N per job, renders to the results table.
6. User can export results as CSV.

### Public methods

- `setupEventListeners()` — wires up the upload buttons.
- `initializeDuckDB()` — boots DuckDB-WASM (lazy on first SQL query).
- `initializeEmbeddingModel()` — loads the MiniLM model (one-time).
- `handleCandidateUpload(file)` / `handleJobUpload(file)` — parse CSV/Excel
  and embed rows.
- `generateMatches()` — runs the matching SQL and renders.

All other methods are private to the class.

## Data Format

### Candidates CSV

Required columns: `name`, `skills` (comma-separated string), `experience_years`
(integer), `location` (string).

```csv
name,skills,experience_years,location
Alice,"python, sql, pytorch",5,NYC
Bob,"java, spring, kafka",8,SF
```

### Jobs CSV

Required columns: `title`, `description`, `required_skills`
(comma-separated string), `location` (string).

```csv
title,description,required_skills,location
Senior Python Developer,"Build ML pipelines","python, pytorch",NYC
Backend Engineer,"Microservices","java, kafka",SF
```

## Testing

```bash
node --test tests/smoke.test.mjs
```

The smoke tests verify file presence, app.js syntax, CSV fixture schema,
and that LICENSE exists. Full browser integration testing would require
Playwright or similar — out of scope for this repo.

## Limitations

- All processing is in-browser; very large CSVs (>10k rows) may slow down.
- The MiniLM embedding model downloads ~25 MB on first use.
- No backend = no cross-user collaboration.

## License

MIT © EzraAir555. See [LICENSE](LICENSE).

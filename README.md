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

## License

MIT

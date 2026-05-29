// Job Matching Dashboard - Main Application Logic

class JobMatchingApp {
    constructor() {
        this.db = null;
        this.candidatesData = null;
        this.jobsData = null;
        this.candidateEmbeddings = null;
        this.jobEmbeddings = null;
        this.pipeline = null;
        
        this.init();
    }
    
    async init() {
        this.setupEventListeners();
        await this.initializeDuckDB();
        await this.initializeEmbeddingModel();
    }
    
    setupEventListeners() {
        // File uploads
        document.getElementById('candidate-upload').addEventListener('click', () => {
            document.getElementById('candidate-file').click();
        });
        
        document.getElementById('job-upload').addEventListener('click', () => {
            document.getElementById('job-file').click();
        });
        
        document.getElementById('candidate-file').addEventListener('change', (e) => {
            this.handleFileUpload(e, 'candidate');
        });
        
        document.getElementById('job-file').addEventListener('change', (e) => {
            this.handleFileUpload(e, 'job');
        });
        
        // Drag and drop
        this.setupDragDrop('candidate-upload', 'candidate-file');
        this.setupDragDrop('job-upload', 'job-file');
        
        // Controls
        document.getElementById('min-score').addEventListener('input', (e) => {
            document.getElementById('min-score-value').textContent = e.target.value + '%';
        });
        
        document.getElementById('generate-matches').addEventListener('click', () => {
            this.generateMatches();
        });
        
        document.getElementById('export-results').addEventListener('click', () => {
            this.exportResults();
        });
    }
    
    setupDragDrop(uploadZoneId, fileInputId) {
        const uploadZone = document.getElementById(uploadZoneId);
        
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.style.background = '#ebf8ff';
        });
        
        uploadZone.addEventListener('dragleave', () => {
            uploadZone.style.background = '';
        });
        
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.style.background = '';
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                document.getElementById(fileInputId).files = files;
                this.handleFileUpload({ target: { files: files } }, uploadZoneId.includes('candidate') ? 'candidate' : 'job');
            }
        });
    }
    
    async initializeDuckDB() {
        const bundle = await duckdb.selectBundle({
            mvp: {
                mainModule: 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.28.0/dist/duckdb-mvp.wasm',
                mainWorker: 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.28.0/dist/duckdb-browser-mvp.worker.js',
            },
            eh: {
                mainModule: 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.28.0/dist/duckdb-eh.wasm',
                mainWorker: 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.28.0/dist/duckdb-browser-eh.worker.js',
            }
        });
        
        const logger = new duckdb.ConsoleLogger();
        this.db = await duckdb.instantiate(bundle, logger);
        
        console.log('✅ DuckDB initialized');
        this.showStatus('db-status', 'success', 'Database ready');
    }
    
    async initializeEmbeddingModel() {
        this.showStatus('model-status', 'loading', 'Loading embedding model...');
        
        try {
            this.pipeline = await transformers.pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
            console.log('✅ Embedding model loaded');
            this.showStatus('model-status', 'success', 'Embedding model ready');
        } catch (error) {
            console.error('Failed to load embedding model:', error);
            this.showStatus('model-status', 'error', 'Failed to load model: ' + error.message);
        }
    }
    
    handleFileUpload(event, type) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                
                if (jsonData.length === 0) {
                    throw new Error('File appears to be empty');
                }
                
                if (type === 'candidate') {
                    this.candidatesData = jsonData;
                    this.updateUploadStatus('candidate', file.name, jsonData.length);
                } else {
                    this.jobsData = jsonData;
                    this.updateUploadStatus('job', file.name, jsonData.length);
                }
                
                this.checkReadyState();
            } catch (error) {
                this.showStatus(`${type}-status`, 'error', `Error: ${error.message}`);
            }
        };
        reader.readAsArrayBuffer(file);
    }
    
    updateUploadStatus(type, filename, rowCount) {
        const statusEl = document.getElementById(`${type}-status`);
        const infoEl = document.getElementById(`${type}-info`);
        const uploadZone = document.getElementById(`${type}-upload`);
        
        statusEl.textContent = `✅ Loaded ${filename}`;
        statusEl.className = 'status success';
        statusEl.classList.remove('hidden');
        
        infoEl.textContent = `${rowCount} records loaded`;
        uploadZone.classList.add('has-data');
        uploadZone.querySelector('p').textContent = `✅ ${filename}`;
    }
    
    checkReadyState() {
        const btn = document.getElementById('generate-matches');
        if (this.candidatesData && this.jobsData) {
            btn.disabled = false;
            btn.textContent = '🚀 Generate Matches';
        }
    }
    
    showStatus(elementId, type, message) {
        const el = document.getElementById(elementId);
        if (!el) return;
        
        el.textContent = message;
        el.className = `status ${type}`;
        el.classList.remove('hidden');
    }
    
    async generateMatches() {
        const minScore = parseInt(document.getElementById('min-score').value);
        const topN = parseInt(document.getElementById('top-n').value);
        
        this.showStatus('match-progress', 'loading', 'Generating embeddings...');
        document.getElementById('match-progress').classList.remove('hidden');
        
        try {
            // Load data into DuckDB
            await this.loadIntoDuckDB();
            
            // Generate embeddings
            await this.generateCandidateEmbeddings();
            await this.generateJobEmbeddings();
            
            // Calculate matches
            const matches = await this.calculateMatches(minScore, topN);
            
            // Display results
            this.displayResults(matches);
            
            this.showStatus('match-progress', 'success', '✅ Matching complete!');
        } catch (error) {
            console.error('Error generating matches:', error);
            this.showStatus('match-progress', 'error', 'Error: ' + error.message);
        }
    }
    
    async loadIntoDuckDB() {
        if (this.candidatesData) {
            await this.db.run(`DROP TABLE IF EXISTS candidates`);
            await this.db.run(`CREATE TABLE candidates (
                id INTEGER,
                name VARCHAR,
                skills VARCHAR,
                experience_years INTEGER,
                resume_text VARCHAR
            )`);
            
            for (const candidate of this.candidatesData) {
                await this.db.run(`INSERT INTO candidates VALUES (?, ?, ?, ?, ?)`, [
                    candidate.id || 0,
                    candidate.name || '',
                    candidate.skills || '',
                    candidate.experience_years || 0,
                    candidate.resume_text || ''
                ]);
            }
        }
        
        if (this.jobsData) {
            await this.db.run(`DROP TABLE IF EXISTS jobs`);
            await this.db.run(`CREATE TABLE jobs (
                id INTEGER,
                title VARCHAR,
                required_skills VARCHAR,
                description VARCHAR,
                experience_required INTEGER
            )`);
            
            for (const job of this.jobsData) {
                await this.db.run(`INSERT INTO jobs VALUES (?, ?, ?, ?, ?)`, [
                    job.id || 0,
                    job.title || '',
                    job.required_skills || '',
                    job.description || '',
                    job.experience_required || 0
                ]);
            }
        }
    }
    
    async generateCandidateEmbeddings() {
        const progressFill = document.getElementById('progress-fill');
        this.candidateEmbeddings = [];
        
        for (let i = 0; i < this.candidatesData.length; i++) {
            const candidate = this.candidatesData[i];
            const text = `${candidate.name} ${candidate.skills} ${candidate.resume_text}`;
            
            const output = await this.pipeline(text, { pooling: 'mean', normalize: true });
            this.candidateEmbeddings.push(Array.from(output.data));
            
            const progress = ((i + 1) / this.candidatesData.length) * 50;
            progressFill.style.width = progress + '%';
        }
    }
    
    async generateJobEmbeddings() {
        const progressFill = document.getElementById('progress-fill');
        this.jobEmbeddings = [];
        
        for (let i = 0; i < this.jobsData.length; i++) {
            const job = this.jobsData[i];
            const text = `${job.title} ${job.required_skills} ${job.description}`;
            
            const output = await this.pipeline(text, { pooling: 'mean', normalize: true });
            this.jobEmbeddings.push(Array.from(output.data));
            
            const progress = 50 + ((i + 1) / this.jobsData.length) * 50;
            progressFill.style.width = progress + '%';
        }
    }
    
    cosineSimilarity(vecA, vecB) {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
    
    async calculateMatches(minScore, topN) {
        const matches = [];
        
        for (let i = 0; i < this.candidatesData.length; i++) {
            const candidate = this.candidatesData[i];
            const candidateEmb = this.candidateEmbeddings[i];
            
            const jobScores = [];
            for (let j = 0; j < this.jobsData.length; j++) {
                const job = this.jobsData[j];
                const jobEmb = this.jobEmbeddings[j];
                
                const score = this.cosineSimilarity(candidateEmb, jobEmb);
                const scorePercent = Math.round(score * 100);
                
                if (scorePercent >= minScore) {
                    jobScores.push({
                        candidate_id: candidate.id,
                        candidate_name: candidate.name,
                        job_id: job.id,
                        job_title: job.title,
                        match_score: scorePercent,
                        skills_overlap: this.calculateSkillsOverlap(candidate.skills, job.required_skills)
                    });
                }
            }
            
            jobScores.sort((a, b) => b.match_score - a.match_score);
            matches.push(...jobScores.slice(0, topN));
        }
        
        matches.sort((a, b) => b.match_score - a.match_score);
        return matches;
    }
    
    calculateSkillsOverlap(candidateSkills, jobSkills) {
        const candidateSet = new Set(candidateSkills.toLowerCase().split(/[,\s]+/).filter(s => s.trim()));
        const jobSet = new Set(jobSkills.toLowerCase().split(/[,\s]+/).filter(s => s.trim()));
        
        const overlap = [...candidateSet].filter(s => jobSet.has(s));
        return overlap.join(', ') || 'None identified';
    }
    
    displayResults(matches) {
        const placeholder = document.getElementById('results-placeholder');
        const container = document.getElementById('results-container');
        const tbody = document.getElementById('results-body');
        const summary = document.getElementById('results-summary');
        
        placeholder.classList.add('hidden');
        container.classList.remove('hidden');
        
        summary.innerHTML = `<strong>${matches.length}</strong> matches found`;
        
        tbody.innerHTML = matches.map(match => `
            <tr>
                <td><strong>${match.candidate_name}</strong></td>
                <td>${match.job_title}</td>
                <td class="match-score ${this.getScoreClass(match.match_score)}">${match.match_score}%</td>
                <td>${match.skills_overlap}</td>
            </tr>
        `).join('');
        
        this.currentMatches = matches;
    }
    
    getScoreClass(score) {
        if (score >= 80) return 'high';
        if (score >= 60) return 'medium';
        return '';
    }
    
    exportResults() {
        if (!this.currentMatches || this.currentMatches.length === 0) return;
        
        const ws = XLSX.utils.json_to_sheet(this.currentMatches);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Job Matches');
        
        XLSX.writeFile(wb, 'job_matches_export.xlsx');
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new JobMatchingApp();
});

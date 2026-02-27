const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;
const DATA_DIR = path.join(__dirname, 'data');

app.use(cors());
app.use(express.json());

// ── Route modules ──
app.use('/api/operations', require('./routes/operations'));
app.use('/api/intelligence', require('./routes/intelligence'));
app.use('/api/agent', require('./routes/agent'));
app.use('/api/sla', require('./routes/sla'));

// ── Static JSON data endpoints (from processed Excel files) ──
app.get('/api/data/:dataset', (req, res) => {
  const dataset = req.params.dataset.replace(/[^a-zA-Z0-9_-]/g, '');
  const filepath = path.join(DATA_DIR, `${dataset}.json`);
  if (fs.existsSync(filepath)) {
    try {
      const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: `Failed to parse ${dataset}.json: ${err.message}` });
    }
  } else {
    res.status(404).json({
      error: `Dataset "${dataset}" not found. Run: node backend/scripts/process-excel-data.js`,
      available: fs.existsSync(DATA_DIR)
        ? fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''))
        : [],
    });
  }
});

// ── Product Feedback endpoint ──
app.get('/api/product-feedback', (req, res) => {
  const filepath = path.join(__dirname, 'product-feedback-data.json');
  try {
    const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    res.json({ ...data, _source: 'salesforce', _updated: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: `Failed to load product feedback data: ${err.message}` });
  }
});

// ── Channel Effort endpoint ──
app.get('/api/channel-effort', (req, res) => {
  const filepath = path.join(__dirname, 'channel-effort-data.json');
  try {
    const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    res.json({ ...data, _source: 'salesforce', _updated: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: `Failed to load channel effort data: ${err.message}` });
  }
});

// ── CSAT Analysis endpoint ──
app.get('/api/csat-analysis', (req, res) => {
  const filepath = path.join(__dirname, 'csat-data.json');
  try {
    const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    res.json({ ...data, _source: 'salesforce', _updated: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: `Failed to load CSAT data: ${err.message}` });
  }
});

// ── CTI Board endpoint ──
app.get('/api/cti-board', (req, res) => {
  const filepath = path.join(__dirname, 'cti-data.json');
  try {
    const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    // Recompute age based on current date
    const now = new Date();
    (data.activeTickets || []).forEach(t => {
      t.ageDays = Math.floor((now - new Date(t.created)) / (1000 * 60 * 60 * 24));
    });
    res.json({ ...data, _source: 'jira', _updated: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: `Failed to load CTI data: ${err.message}` });
  }
});

// ── BigQuery placeholder endpoints ──
app.get('/api/bq/*', (req, res) => {
  res.json({
    status: 'pending',
    message: 'BigQuery integration pending. Data will be available once BQ connection is configured.',
    placeholder: true,
    endpoint: req.path,
  });
});

// ── Health check ──
app.get('/api/health', (req, res) => {
  const dataFiles = fs.existsSync(DATA_DIR)
    ? fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'))
    : [];
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    dataFiles: dataFiles.length,
    datasets: dataFiles.map(f => f.replace('.json', '')),
  });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  if (fs.existsSync(DATA_DIR)) {
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
    console.log(`  ${files.length} processed datasets available: ${files.map(f => f.replace('.json', '')).join(', ')}`);
  } else {
    console.log('  ⚠ No processed data found. Run: node backend/scripts/process-excel-data.js');
  }
});

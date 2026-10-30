const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'urls.json');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Initialize local database storage
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([]));
}

function getDatabase() {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}

function saveDatabase(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function generateCode() {
    return Math.random().toString(36).substring(2, 8);
}

// API: Shorten URL
app.post('/api/shorten', (req, res) => {
    let { originalUrl } = req.body;
    if (!originalUrl) {
        return res.status(400).json({ error: 'URL is required' });
    }

    if (!originalUrl.startsWith('http://') && !originalUrl.startsWith('https://')) {
        originalUrl = 'https://' + originalUrl;
    }

    const urls = getDatabase();
    const shortCode = generateCode();

    const newEntry = {
        id: shortCode,
        originalUrl,
        shortCode,
        clicks: 0,
        createdAt: new Date().toISOString()
    };

    urls.push(newEntry);
    saveDatabase(urls);

    res.json({
        shortUrl: `${req.protocol}://${req.get('host')}/${shortCode}`,
        shortCode,
        originalUrl,
        clicks: 0
    });
});

// API: Get Analytics
app.get('/api/analytics', (req, res) => {
    const urls = getDatabase();
    res.json(urls);
});

// Redirect endpoint
app.get('/:code', (req, res) => {
    const urls = getDatabase();
    const item = urls.find(u => u.shortCode === req.params.code);

    if (item) {
        item.clicks += 1;
        saveDatabase(urls);
        return res.redirect(item.originalUrl);
    }

    res.status(404).send('Short URL not found');
});

app.listen(PORT, () => {
    console.log(`Server active on port ${PORT}`);
});

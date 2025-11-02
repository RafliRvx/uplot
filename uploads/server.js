const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('.'));

// API Routes
app.use('/api/upload', require('./api/upload'));
app.use('/api/files', require('./api/files'));

// File serving route
app.get('/:fileId', (req, res) => {
    res.redirect(`/api/files/${req.params.fileId}`);
});

// Root route - serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Cleanup on startup
cleanupExpiredFiles();

module.exports = app; // ✅ Penting untuk Vercel!

// Hanya jalankan server jika bukan di Vercel
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
}

function cleanupExpiredFiles() {
    try {
        const dbPath = path.join(__dirname, 'database.json');
        if (!fs.existsSync(dbPath)) return;

        const database = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const now = new Date();
        
        database.files = database.files.filter(file => {
            if (file.expiryDate && new Date(file.expiryDate) < now) {
                const filePath = path.join(__dirname, 'uploads', file.filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
                return false;
            }
            return true;
        });

        fs.writeFileSync(dbPath, JSON.stringify(database, null, 2));
        console.log('🧹 Cleaned up expired files');
    } catch (error) {
        console.error('Cleanup error:', error);
    }
}
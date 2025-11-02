const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const fileId = generateFileId();
        const extension = path.extname(file.originalname);
        cb(null, fileId + extension);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB max
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
            'video/mp4', 'video/mpeg', 'video/quicktime',
            'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg',
            'application/pdf', 'text/plain', 'application/zip'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed'), false);
        }
    }
});

function generateFileId() {
    return Math.random().toString(36).substring(2, 10);
}

function calculateExpiryDate(expiryOption) {
    const now = new Date();
    switch (expiryOption) {
        case '1h':
            return new Date(now.getTime() + 60 * 60 * 1000);
        case '1d':
            return new Date(now.getTime() + 24 * 60 * 60 * 1000);
        case '1m':
            return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        case 'never':
            return null;
        default:
            return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
}

router.post('/', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }

        const fileId = path.parse(req.file.filename).name;
        const expiry = req.body.expiry || '1d';
        const expiryDate = calculateExpiryDate(expiry);

        // Save to JSON database
        const fileData = {
            id: fileId,
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
            uploadDate: new Date().toISOString(),
            expiryDate: expiryDate ? expiryDate.toISOString() : null,
            views: 0
        };

        saveFileToDB(fileData);

        const fileUrl = `${getBaseUrl()}/${fileId}`;

        res.json({
            success: true,
            url: fileUrl,
            id: fileId,
            expiry: expiryDate ? expiryDate.toISOString() : 'Never'
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            error: 'Upload failed: ' + error.message
        });
    }
});

function getBaseUrl() {
    return process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000';
}

function saveFileToDB(fileData) {
    const dbPath = path.join(process.cwd(), 'database.json');
    let database = { files: [] };

    try {
        if (fs.existsSync(dbPath)) {
            const data = fs.readFileSync(dbPath, 'utf8');
            database = JSON.parse(data);
        }
    } catch (error) {
        console.error('Error reading database:', error);
    }

    database.files.push(fileData);

    try {
        fs.writeFileSync(dbPath, JSON.stringify(database, null, 2));
    } catch (error) {
        console.error('Error writing database:', error);
    }
}

module.exports = router;
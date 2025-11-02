const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();

router.get('/:fileId', (req, res) => {
    try {
        const fileId = req.params.fileId;
        
        // Load database
        const dbPath = path.join(process.cwd(), 'database.json');
        if (!fs.existsSync(dbPath)) {
            return res.status(404).send('File not found');
        }

        const database = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const fileData = database.files.find(file => file.id === fileId);

        if (!fileData) {
            return res.status(404).send('File not found');
        }

        // Check if file is expired
        if (fileData.expiryDate && new Date(fileData.expiryDate) < new Date()) {
            // Delete expired file
            deleteFile(fileData);
            return res.status(410).send('File has expired');
        }

        // Update view count
        fileData.views = (fileData.views || 0) + 1;
        saveDatabase(database);

        const filePath = path.join(process.cwd(), 'uploads', fileData.filename);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).send('File not found');
        }

        // Set appropriate headers
        res.setHeader('Content-Type', fileData.mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${fileData.originalName}"`);
        
        // Serve file
        res.sendFile(filePath);

    } catch (error) {
        console.error('File serve error:', error);
        res.status(500).send('Server error');
    }
});

function deleteFile(fileData) {
    try {
        const filePath = path.join(process.cwd(), 'uploads', fileData.filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        
        // Remove from database
        const dbPath = path.join(process.cwd(), 'database.json');
        const database = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        database.files = database.files.filter(file => file.id !== fileData.id);
        saveDatabase(database);
    } catch (error) {
        console.error('Error deleting file:', error);
    }
}

function saveDatabase(database) {
    try {
        const dbPath = path.join(process.cwd(), 'database.json');
        fs.writeFileSync(dbPath, JSON.stringify(database, null, 2));
    } catch (error) {
        console.error('Error saving database:', error);
    }
}

module.exports = router;
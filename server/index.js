
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const ffmpeg = require('fluent-ffmpeg');
const ffprobeStatic = require('ffprobe-static');

// Configure fluent-ffmpeg to use the static binary
ffmpeg.setFfprobePath(ffprobeStatic.path);

const app = express();
const PORT = 3001;

// Enable CORS for frontend
app.use(cors());
app.use(express.json());

const CONFIG_FILE = path.join(__dirname, 'config.json');

// Helper to get configuration
const getConfig = () => {
    if (fs.existsSync(CONFIG_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        } catch (e) {
            console.error("Error reading config:", e);
        }
    }
    // Default to a local courses folder if not configured
    const defaultPath = path.join(__dirname, '..', 'courses');
    if (!fs.existsSync(defaultPath)) {
        fs.mkdirSync(defaultPath, { recursive: true });
    }
    return { rootDir: defaultPath };
};

// Helper to save configuration
const saveConfig = (config) => {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
};

// Function to recursively scan directory
const getDirectoryStructure = (dirPath, rootPath) => {
    try {
        const items = fs.readdirSync(dirPath);
        const structure = [];

        items.forEach(item => {
            // Skip hidden files
            if (item.startsWith('.')) return;

            const fullPath = path.join(dirPath, item);
            let stats;
            try {
                stats = fs.statSync(fullPath);
            } catch (e) {
                return; // Skip if cant read
            }

            // Skip unwanted links (only if it's a file)
            const lowerItem = item.toLowerCase();
            if (stats.isFile() && (lowerItem.includes('[courseclub.me]') || lowerItem.includes('[fcsnew.net]'))) {
                return;
            }

            // Calculate relative path from the *configured root*
            const relativePath = path.relative(rootPath, fullPath).replace(/\\/g, '/');

            if (stats.isDirectory()) {
                const children = getDirectoryStructure(fullPath, rootPath);

                // Find a thumbnail image for this directory
                const thumbnailChild = children.find(c => c.type === 'file' && c.name.toLowerCase().startsWith('thumbnail.'));
                const filteredChildren = children.filter(c => !(c.type === 'file' && c.name.toLowerCase().startsWith('thumbnail.')));

                structure.push({
                    type: 'directory',
                    name: item,
                    path: relativePath,
                    children: filteredChildren,
                    thumbnailPath: thumbnailChild ? thumbnailChild.path : null
                });
            } else {
                structure.push({
                    type: 'file',
                    name: item,
                    path: relativePath,
                    size: stats.size
                });
            }
        });
        return structure;
    } catch (error) {
        console.error(`Error reading directory ${dirPath}:`, error);
        return [];
    }
};

// API to get current config
app.get('/api/config', (req, res) => {
    res.json(getConfig());
});

// API to update courses directory
app.post('/api/config', (req, res) => {
    try {
        console.log('Received config update request:', req.body);
        if (!req.body) {
            throw new Error('Request body is empty (middleware issue?)');
        }
        const { path: newPath } = req.body;
        if (!newPath) {
            return res.status(400).json({ error: 'Path is required' });
        }

        if (!fs.existsSync(newPath)) {
            return res.status(400).json({ error: 'Directory does not exist' });
        }

        const config = getConfig();
        config.rootDir = newPath;
        saveConfig(config);
        res.json({ success: true, rootDir: newPath });
    } catch (error) {
        console.error('Error updating config:', error);
        res.status(500).json({ error: 'Internal Server Error: ' + error.message });
    }
});



// API to open native folder picker (Windows only)
app.get('/api/browse', (req, res) => {
    const psCommand = `powershell -sta -noprofile -command "Add-Type -AssemblyName System.Windows.Forms; $d = New-Object System.Windows.Forms.FolderBrowserDialog; $d.Description = 'Select Course Directory'; $d.ShowNewFolderButton = $true; if ($d.ShowDialog() -eq 'OK') { Write-Host $d.SelectedPath }"`;

    exec(psCommand, (error, stdout, stderr) => {
        if (error) {
            console.error('Error opening folder picker:', error);
            return res.status(500).json({ error: 'Failed to open folder picker' });
        }

        const selectedPath = stdout.trim();
        if (selectedPath) {
            res.json({ path: selectedPath });
        } else {
            res.json({ cancelled: true });
        }
    });
});

// API to get all courses
app.get('/api/courses', (req, res) => {
    try {
        const config = getConfig();
        console.log(`Scanning courses from: ${config.rootDir}`);

        if (!fs.existsSync(config.rootDir)) {
            return res.json([]);
        }

        const structure = getDirectoryStructure(config.rootDir, config.rootDir);
        res.json(structure);
    } catch (error) {
        console.error('Error scanning directory:', error);
        res.status(500).json({ error: 'Failed to scan courses directory' });
    }
});

// API to stream video
app.get('/api/video', (req, res) => {
    const videoPath = req.query.path; // Relative path
    if (!videoPath) {
        return res.status(400).send('Path is required');
    }

    const config = getConfig();
    const fullPath = path.join(config.rootDir, videoPath);

    // Security check to prevent directory traversal
    // We check if the resolved full path starts with the configured root
    const resolvedPath = path.resolve(fullPath);
    const resolvedRoot = path.resolve(config.rootDir);

    if (!resolvedPath.startsWith(resolvedRoot)) {
        return res.status(403).send('Access denied');
    }

    if (!fs.existsSync(fullPath)) {
        return res.status(404).send('File not found');
    }

    const stat = fs.statSync(fullPath);
    const fileSize = stat.size;
    const range = req.headers.range;
    const ext = path.extname(fullPath).toLowerCase();

    console.log('Serving file:', fullPath);
    console.log('Extension:', ext);

    const mimeTypes = {
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.ogg': 'video/ogg',
        '.mkv': 'video/x-matroska',
        '.pdf': 'application/pdf',
        '.html': 'text/html',
        '.htm': 'text/html',
        '.txt': 'text/plain',
        '.md': 'text/markdown',
        '.zip': 'application/zip',
        '.rar': 'application/x-rar-compressed',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.gif': 'image/gif'
    };
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(fullPath, { start, end });
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': contentType,
        };
        res.writeHead(206, head);
        file.pipe(res);
    } else {
        const head = {
            'Content-Length': fileSize,
            'Content-Type': contentType,
        };
        res.writeHead(200, head);
        fs.createReadStream(fullPath).pipe(res);
    }
});

app.get('/api/duration', (req, res) => {
    const videoPath = req.query.path;
    if (!videoPath) return res.status(400).send('Path is required');

    const config = getConfig();
    const fullPath = path.join(config.rootDir, videoPath);

    // Security check
    const resolvedPath = path.resolve(fullPath);
    const resolvedRoot = path.resolve(config.rootDir);
    if (!resolvedPath.startsWith(resolvedRoot)) {
        return res.status(403).send('Access denied');
    }

    if (!fs.existsSync(fullPath)) {
        return res.status(404).json({ duration: 0 });
    }

    // Only try to get duration for video files
    const ext = path.extname(fullPath).toLowerCase();
    if (!['.mp4', '.mkv', '.webm', '.ogg', '.mov', '.avi'].includes(ext)) {
        return res.json({ duration: 0 });
    }

    ffmpeg.ffprobe(fullPath, (err, metadata) => {
        if (err) {
            console.error('ffprobe error:', err);
            return res.json({ duration: 0 });
        }
        res.json({ duration: metadata.format.duration });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    const config = getConfig();
    console.log(`Serving courses from: ${config.rootDir}`);
});

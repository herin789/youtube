const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve static files like HTML, CSS, and uploaded files

// Configure MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'tiger',
    database: 'youtube_clone'
});

db.connect(err => {
    if (err) throw err;
    console.log('Connected to MySQL');
});

// Configure Multer for video and thumbnail uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.fieldname === 'video') {
            cb(null, 'public/uploads/videos');
        } else if (file.fieldname === 'thumbnail') {
            cb(null, 'public/uploads/thumbnails');
        }
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// Endpoint to upload a video (Admin only)
app.post('/upload', upload.fields([{ name: 'video' }, { name: 'thumbnail' }]), (req, res) => {
    const { title, description } = req.body;
    const videoPath = '/uploads/videos/' + req.files.video[0].filename;
    const thumbnailPath = '/uploads/thumbnails/' + req.files.thumbnail[0].filename;

    const query = 'INSERT INTO videos (title, description, video_url, thumbnail_url, uploaded_at) VALUES (?, ?, ?, ?, NOW())';
    db.query(query, [title, description, videoPath, thumbnailPath], (err, result) => {
        if (err) throw err;
        res.redirect('/admin');
    });
});

// Endpoint to fetch videos for the homepage
app.get('/videos', (req, res) => {
    const query = 'SELECT * FROM videos ORDER BY uploaded_at DESC';
    db.query(query, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

// Serve index and admin pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

const fs = require('fs');

// Ensure the uploads directories exist
const videoDir = path.join(__dirname, 'public/uploads/videos');
const thumbnailDir = path.join(__dirname, 'public/uploads/thumbnails');

if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir, { recursive: true });
}
if (!fs.existsSync(thumbnailDir)) {
    fs.mkdirSync(thumbnailDir, { recursive: true });
}




// Start the server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});

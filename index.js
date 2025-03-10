const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const declarationRoutes = require('./routes/declarations');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const articleRoutes = require('./routes/articles');
const galleryImageRoutes = require('./routes/galleryImages');
const contactRoutes = require('./routes/contact');

dotenv.config();
const app = express();

// Connect to database
connectDB();

// Middleware
app.use(cors({
    origin: [
        'https://leah-website-client-q5r8.vercel.app', 
        'http://localhost:3000',
        'https://www.leahgenish.com',
        'https://leahgenish.com'
    ],
    credentials: true
}));
app.use(express.json({ limit: '50mb' })); // הגדלת הגבול עבור תמונות
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// הגדרת תיקיית uploads כסטטית
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Define Routes
app.use('/api/declarations', declarationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes); // הוספת נתיבי המאמרים
app.use('/api/gallery', galleryImageRoutes);
app.use('/api/contact', contactRoutes);
// בקובץ routes בשרת
app.get('/api/ping', (req, res) => {
    res.json({ status: 'ok' });
  });
// עדכון ב-PORT
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
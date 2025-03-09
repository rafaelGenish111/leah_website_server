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

dotenv.config();
const app = express();

// Connect to database
connectDB();

// Middleware
app.use(cors({
    origin: ['https://leah-website-client-q5r8.vercel.app', 'http://localhost:3000'],
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

// עדכון ב-PORT
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
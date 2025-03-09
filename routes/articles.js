// server/routes/articles.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Article = require('../models/article');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// הגדרת אחסון תמונות
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/articles';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5000000 }, // 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('שגיאה: קבצי תמונה בלבד!');
    }
  }
});

// קבלת כל המאמרים (ציבורי)
router.get('/', async (req, res) => {
  try {
    const articles = await Article.find({ published: true })
      .sort({ date: -1 })
      .select('-content');
      
    res.json(articles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('שגיאת שרת');
  }
});

// קבלת כל המאמרים למנהל (כולל טיוטות)
router.get('/all', auth, async (req, res) => {
  try {
    const articles = await Article.find().sort({ date: -1 });
    res.json(articles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('שגיאת שרת');
  }
});

// קבלת מאמר בודד לפי מזהה
router.get('/:id', async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({ msg: 'מאמר לא נמצא' });
    }
    
    if (!article.published) {
      return res.status(404).json({ msg: 'מאמר לא נמצא' });
    }
    
    res.json(article);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'מאמר לא נמצא' });
    }
    
    res.status(500).send('שגיאת שרת');
  }
});

// קבלת מאמר למנהל (גם טיוטות)
router.get('/admin/:id', auth, async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({ msg: 'מאמר לא נמצא' });
    }
    
    res.json(article);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'מאמר לא נמצא' });
    }
    
    res.status(500).send('שגיאת שרת');
  }
});

// יצירת מאמר חדש
router.post('/', [auth, upload.single('image')], async (req, res) => {
  try {
    const { title, summary, content, published } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ msg: 'נא להעלות תמונה' });
    }
    
    // יצירת URL לתמונה
    const imageUrl = `${req.protocol}://${req.get('host')}/${req.file.path.replace(/\\/g, '/')}`;
    
    const newArticle = new Article({
      title,
      summary,
      content,
      image: imageUrl,
      published: published === 'true',
      author: 'ליאה גניש'
    });
    
    const article = await newArticle.save();
    res.json(article);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('שגיאת שרת');
  }
});

// עדכון מאמר קיים
router.put('/:id', [auth, upload.single('image')], async (req, res) => {
  try {
    let article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({ msg: 'מאמר לא נמצא' });
    }
    
    // עדכון שדות
    const { title, summary, content, published } = req.body;
    
    article.title = title;
    article.summary = summary;
    article.content = content;
    article.published = published === 'true';
    
    // אם הועלתה תמונה חדשה
    if (req.file) {
      // מחיקת התמונה הישנה (אופציונלי)
      const oldImagePath = article.image.replace(`${req.protocol}://${req.get('host')}/`, '');
      try {
        fs.unlinkSync(oldImagePath);
      } catch (err) {
        console.error('Error deleting old image:', err);
      }
      
      // עדכון לתמונה החדשה
      article.image = `${req.protocol}://${req.get('host')}/${req.file.path.replace(/\\/g, '/')}`;
    }
    
    await article.save();
    res.json(article);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'מאמר לא נמצא' });
    }
    
    res.status(500).send('שגיאת שרת');
  }
});

// מחיקת מאמר
router.delete('/:id', auth, async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({ msg: 'מאמר לא נמצא' });
    }
    
    // מחיקת התמונה
    const imagePath = article.image.replace(`${req.protocol}://${req.get('host')}/`, '');
    try {
      fs.unlinkSync(imagePath);
    } catch (err) {
      console.error('Error deleting image:', err);
    }
    
    await article.remove();
    res.json({ msg: 'המאמר נמחק' });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'מאמר לא נמצא' });
    }
    
    res.status(500).send('שגיאת שרת');
  }
});

module.exports = router;
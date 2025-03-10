const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const GalleryImage = require('../models/galleryImage');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// הגדרת אחסון תמונות
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/gallery';
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

// קבלת כל התמונות (ציבורי) - רק מפורסמות
router.get('/public', async (req, res) => {
  try {
    const images = await GalleryImage.find({ published: true })
      .sort({ order: 1, date: -1 });
      
    res.json(images);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('שגיאת שרת');
  }
});

// קבלת כל התמונות למנהל (כולל לא מפורסמות)
router.get('/', auth, async (req, res) => {
  try {
    const images = await GalleryImage.find().sort({ order: 1, date: -1 });
    res.json(images);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('שגיאת שרת');
  }
});

// קבלת תמונה בודדת לפי מזהה
router.get('/:id', auth, async (req, res) => {
  try {
    const image = await GalleryImage.findById(req.params.id);
    
    if (!image) {
      return res.status(404).json({ msg: 'תמונה לא נמצאה' });
    }
    
    res.json(image);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'תמונה לא נמצאה' });
    }
    
    res.status(500).send('שגיאת שרת');
  }
});

// העלאת תמונה חדשה
router.post('/', [auth, upload.single('image')], async (req, res) => {
  try {
    const { title, description, category, published, order } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ msg: 'נא להעלות תמונה' });
    }
    
    // יצירת URL לתמונה
    const imageUrl = `${req.protocol}://${req.get('host')}/${req.file.path.replace(/\\/g, '/')}`;
    
    const newGalleryImage = new GalleryImage({
      title,
      description,
      category: category || 'general',
      order: order || 0,
      image: imageUrl,
      published: published === 'true'
    });
    
    const savedImage = await newGalleryImage.save();
    res.json(savedImage);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('שגיאת שרת');
  }
});

// עדכון תמונה קיימת
router.put('/:id', [auth, upload.single('image')], async (req, res) => {
  try {
    let galleryImage = await GalleryImage.findById(req.params.id);
    
    if (!galleryImage) {
      return res.status(404).json({ msg: 'תמונה לא נמצאה' });
    }
    
    // עדכון שדות
    const { title, description, category, published, order } = req.body;
    
    galleryImage.title = title;
    galleryImage.description = description || '';
    galleryImage.category = category || galleryImage.category;
    galleryImage.published = published === 'true';
    
    if (order) {
      galleryImage.order = parseInt(order);
    }
    
    // אם הועלתה תמונה חדשה
    if (req.file) {
      // מחיקת התמונה הישנה
      const oldImagePath = galleryImage.image.replace(`${req.protocol}://${req.get('host')}/`, '');
      try {
        fs.unlinkSync(oldImagePath);
      } catch (err) {
        console.error('Error deleting old image:', err);
      }
      
      // עדכון לתמונה החדשה
      galleryImage.image = `${req.protocol}://${req.get('host')}/${req.file.path.replace(/\\/g, '/')}`;
    }
    
    await galleryImage.save();
    res.json(galleryImage);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'תמונה לא נמצאה' });
    }
    
    res.status(500).send('שגיאת שרת');
  }
});

// פונקציית עזר לטיפול בנתיבי קבצים
function extractFilePath(fileUrl, baseUrl) {
    try {
      // הסרת פרוטוקול ודומיין מה-URL המלא
      let filePath = fileUrl;
      
      // בדיקה אם זה URL מלא
      if (fileUrl.startsWith('http')) {
        // ניסיון ראשון - החלפת המחרוזת הידועה
        if (baseUrl && fileUrl.includes(baseUrl)) {
          filePath = fileUrl.replace(baseUrl, '');
        } else {
          // ניסיון שני - הסרת פרוטוקול, דומיין ונמל
          const urlObj = new URL(fileUrl);
          filePath = urlObj.pathname;
        }
      }
      
      // הסרת לוכסן מוביל אם קיים
      if (filePath.startsWith('/')) {
        filePath = filePath.substring(1);
      }
      
      // תיקון קידוד URL
      filePath = decodeURIComponent(filePath);
      
      return filePath;
    } catch (err) {
      console.error('Error extracting file path:', err);
      // החזרת המחרוזת המקורית אם יש שגיאה בעיבוד
      return fileUrl;
    }
  }
  
  // שימוש בפונקציה בנתיב המחיקה:
  router.delete('/:id', auth, async (req, res) => {
    try {
      const galleryImage = await GalleryImage.findById(req.params.id);
      
      if (!galleryImage) {
        return res.status(404).json({ msg: 'תמונה לא נמצאה' });
      }
      
      // הוצאת נתיב הקובץ מה-URL באופן חסין יותר
      const baseUrl = `${req.protocol}://${req.get('host')}/`;
      const imagePath = extractFilePath(galleryImage.image, baseUrl);
      
      // מחיקת קובץ התמונה
      try {
        // בדיקה אם הקובץ קיים לפני ניסיון מחיקה
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log(`Successfully deleted: ${imagePath}`);
        } else {
          console.log(`File does not exist: ${imagePath}`);
        }
      } catch (err) {
        console.error(`Error deleting image file: ${imagePath}`, err);
      }
      
      // שימוש ב-deleteOne במקום remove
      await GalleryImage.deleteOne({ _id: galleryImage._id });
      
      res.json({ msg: 'התמונה נמחקה' });
    } catch (err) {
      console.error('Error deleting gallery image:', err);
      
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'תמונה לא נמצאה' });
      }
      
      res.status(500).send('שגיאת שרת');
    }
  });

// עדכון סדר התמונות
router.post('/reorder', auth, async (req, res) => {
  try {
    const { images } = req.body;
    
    // בדיקה שהמערך תקין
    if (!Array.isArray(images)) {
      return res.status(400).json({ msg: 'מבנה נתונים לא תקין' });
    }
    
    // עדכון סדר התמונות
    for (const item of images) {
      await GalleryImage.findByIdAndUpdate(item.id, { order: item.order });
    }
    
    res.json({ msg: 'סדר התמונות עודכן בהצלחה' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('שגיאת שרת');
  }
});

module.exports = router;
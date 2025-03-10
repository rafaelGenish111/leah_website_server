// server/routes/contact.js
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { check, validationResult } = require('express-validator');

// @route   POST api/contact
// @desc    שליחת טופס יצירת קשר
// @access  Public
router.post(
  '/',
  [
    check('name', 'נא להזין שם').not().isEmpty(),
    check('email', 'נא להזין אימייל תקין').isEmail(),
    check('message', 'נא להזין הודעה').not().isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, message } = req.body;

    try {
      // יצירת Transporter של Nodemailer
      const transporter = nodemailer.createTransport({
        service: 'gmail', // אפשר לשנות לספק אחר כמו SendGrid, SMTP וכו'
        auth: {
          user: process.env.EMAIL_USERNAME, // המייל שממנו תישלח ההודעה
          pass: process.env.EMAIL_PASSWORD    // סיסמה או App Password
        }
      });

      // בניית תוכן המייל
      const mailOptions = {
        from: process.env.EMAIL_USERNAME,
        to: 'leahgenish111@gmail.com', // המייל שאליו תישלח ההודעה (הדוא"ל שלך)
        subject: `פנייה חדשה מהאתר - ${name}`,
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; padding: 15px;">
            <h2>פנייה חדשה מטופס יצירת קשר</h2>
            <p><strong>שם:</strong> ${name}</p>
            <p><strong>אימייל:</strong> ${email}</p>
            <p><strong>טלפון:</strong> ${phone || '-'}</p>
            <h3>תוכן ההודעה:</h3>
            <p>${message.replace(/\n/g, '<br>')}</p>
            <hr>
            <p style="color: #888;">נשלח מטופס יצירת קשר באתר</p>
          </div>
        `
      };

      // שליחת המייל
      await transporter.sendMail(mailOptions);

      // החזרת תשובה חיובית
      res.json({ msg: 'ההודעה נשלחה בהצלחה' });
    } catch (err) {
      console.error('Error sending email:', err.message);
      res.status(500).send('שגיאת שרת');
    }
  }
);

module.exports = router;
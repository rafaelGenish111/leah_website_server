const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Declaration = require('../models/declaration');

// @route   GET api/declarations
// @desc    Get all declarations
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const declarations = await Declaration.find().sort({ date: -1 });
    res.json(declarations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('שגיאת שרת');
  }
});

// @route   GET api/declarations/:id
// @desc    Get declaration by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const declaration = await Declaration.findById(req.params.id);
    
    if (!declaration) {
      return res.status(404).json({ msg: 'הצהרה לא נמצאה' });
    }
    
    res.json(declaration);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'הצהרה לא נמצאה' });
    }
    
    res.status(500).send('שגיאת שרת');
  }
});

// @route   POST api/declarations
// @desc    Create a declaration
// @access  Public
router.post('/', async (req, res) => {
  try {
    const newDeclaration = new Declaration({
      name: req.body.name,
      idNumber: req.body.idNumber,
      phone: req.body.phone,
      healthConditions: req.body.healthConditions,
      confirmTruth: req.body.confirmTruth,
      signature: req.body.signature
    });
    
    const declaration = await newDeclaration.save();
    res.json(declaration);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('שגיאת שרת');
  }
});

// @route   DELETE api/declarations/:id
// @desc    Delete a declaration
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const declaration = await Declaration.findById(req.params.id);
    
    if (!declaration) {
      return res.status(404).json({ msg: 'הצהרה לא נמצאה' });
    }
    
    await declaration.remove();
    res.json({ msg: 'הצהרה הוסרה' });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'הצהרה לא נמצאה' });
    }
    
    res.status(500).send('שגיאת שרת');
  }
});

module.exports = router;

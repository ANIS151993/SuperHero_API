// routes/SuperheroCharacter.js
import express from 'express';
const router = express.Router();
import superheroCharacter from '../models/SuperheroCharacter.js';

// @route   GET /api/superhero-characters
// @desc    Get all SuperHero characters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const allCharacters = await superheroCharacter.find().sort({ name: 1 });
    res.json(allCharacters);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/superhero-characters/:name
// @desc    Get a single SuperHero character by name (partial, case-insensitive match)
// @access  Public
router.get('/:name', async (req, res) => {
  try {
    const regex = new RegExp(`^${req.params.name}`, 'i');
    const character = await superheroCharacter.findOne({ name: regex });
    if (!character) {
      return res.status(404).json({ message: 'SuperHero character not found' });
    }
    res.json(character);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

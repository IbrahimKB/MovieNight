import { Router } from 'express';
import { db } from '../db';

const router = Router();

// GET /api/suggestions — list all suggestions
router.get('/', async (req, res, next) => {
  try {
    await db.read();
    res.json(db.data?.suggestions ?? []);
  } catch (err) {
    next(err);
  }
});

// POST /api/suggestions — add a new suggestion
router.post('/', async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'suggestion text is required' });
    }

    await db.read();
    const newSuggestion = {
      id: Date.now().toString(),
      text
    };
    db.data!.suggestions.push(newSuggestion);
    await db.write();

    res.status(201).json(newSuggestion);
  } catch (err) {
    next(err);
  }
});

export default router;

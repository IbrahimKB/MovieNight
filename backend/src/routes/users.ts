import { Router } from 'express';
import { db } from '../db';

const router = Router();

// GET /api/users — list all users
router.get('/', async (req, res, next) => {
  try {
    await db.read();
    res.json(db.data?.users ?? []);
  } catch (err) {
    next(err);
  }
});

// POST /api/users — create a new user
router.post('/', async (req, res, next) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'name and email are required' });
    }

    await db.read();
    const newUser = {
      id: Date.now().toString(),
      name,
      email
    };
    db.data!.users.push(newUser);
    await db.write();

    res.status(201).json(newUser);
  } catch (err) {
    next(err);
  }
});

export default router;

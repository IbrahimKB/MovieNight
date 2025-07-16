import { Router } from 'express';
import usersRouter from './users';
import suggestionsRouter from './suggestions';

const router = Router();

// Route: GET/POST /api/users
router.use('/users', usersRouter);

// Route: GET/POST /api/suggestions
router.use('/suggestions', suggestionsRouter);

export default router;

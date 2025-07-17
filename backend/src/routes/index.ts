import { Router } from 'express';
import usersRouter from './users';
import suggestionsRouter from './suggestions';
import friendshipsRouter from "./friendships";

const router = Router();

// Route: GET/POST /api/users
router.use('/users', usersRouter);

// Route: GET/POST /api/suggestions
router.use('/suggestions', suggestionsRouter);
router.use("/friendships", friendshipsRouter);

export default router;

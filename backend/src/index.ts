import express from 'express';
import dotenv from 'dotenv';
import { initDB } from './db';
import apiRouter from './routes';

dotenv.config();

(async () => {
  // Initialize the database (creates file + default data if needed)
  await initDB();

  const app = express();
  app.use(express.json());

  // Mount all API routes under /api/*
  app.use('/api', apiRouter);

  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => {
    console.log(`🚀 API listening at http://localhost:${PORT}`);
  });
})();

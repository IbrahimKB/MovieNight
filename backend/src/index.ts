import express from 'express';
import dotenv from 'dotenv';
import { initDB } from './db';
import apiRouter from './routes';

dotenv.config();

(async () => {
  await initDB();

  const app = express();
  app.use(express.json());
  app.use('/api', apiRouter);

  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => {
    console.log(`🚀 API listening at http://localhost:${PORT}`);
  });
})();

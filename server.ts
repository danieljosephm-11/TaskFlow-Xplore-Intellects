import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import app from './server/src/app.ts';
import { connectDB } from './server/src/config/db.ts';
import { seedDatabase } from './server/scripts/seed.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);

async function startServer() {
  try {
    // 1. Connect to Database (MongoDB Atlas with fallback)
    await connectDB();

    // 2. Initialize Seed data (creates demo accounts and tasks if empty)
    await seedDatabase(false);

    // 3. Mount Frontend in Dev or Prod
    if (process.env.NODE_ENV === 'production') {
      const distPath = path.resolve(__dirname, 'dist');
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    } else {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    }

    // 4. Start Listening
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`====================================================`);
      console.log(`TaskFlow — Xplore Intellects running on port ${PORT}`);
      console.log(`API endpoints accessible at /api/*`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('Fatal server startup failure:', error);
    process.exit(1);
  }
}

startServer();

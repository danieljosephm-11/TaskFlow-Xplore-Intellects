import dotenv from 'dotenv';
dotenv.config();

import app from './app.ts';
import { connectDB } from './config/db.ts';
import { seedDatabase } from '../scripts/seed.ts';

const PORT = parseInt(process.env.PORT || '5000', 10);

async function startStandaloneServer() {
  try {
    await connectDB();
    await seedDatabase(false);

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Standalone Express API server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Fatal standalone server startup error:', error);
    process.exit(1);
  }
}

startStandaloneServer();

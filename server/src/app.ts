import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.ts';
import employeeRoutes from './routes/employeeRoutes.ts';
import taskRoutes from './routes/taskRoutes.ts';
import dashboardRoutes from './routes/dashboardRoutes.ts';
import notificationRoutes from './routes/notificationRoutes.ts';
import { errorHandler } from './middleware/errorHandler.ts';
import { getDBStatus } from './config/db.ts';
import { seedDatabase } from '../scripts/seed.ts';

const app = express();

// Security and utility middleware
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health and Diagnostics endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  const dbStatus = getDBStatus();
  res.status(200).json({
    status: 'online',
    system: 'TaskFlow — Xplore Intellects',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: dbStatus,
  });
});

// Demo re-seed endpoint (useful for testing and reset during assessment review)
app.post('/api/seed/reset', async (_req: Request, res: Response) => {
  try {
    await seedDatabase(true);
    res.status(200).json({
      success: true,
      message: 'Database has been cleanly reseeded with demo data.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: `Seed reset failed: ${error.message}`,
    });
  }
});

// Mount modular API routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 handler for API routes
app.all('/api/*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.method} ${req.originalUrl} not found.`,
  });
});

// Centralized Error Boundary
app.use(errorHandler);

export default app;

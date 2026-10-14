import { Response } from 'express';
import { DataService } from '../services/dataService.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';

export class DashboardController {
  /**
   * GET /api/dashboard/admin
   * Admin only: Aggregated real-time metrics, chart distributions, employee summaries, and recent events
   */
  static async getAdminDashboard(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const stats = await DataService.getAdminDashboardStats();
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('Error compiling admin dashboard metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to compile admin dashboard analytics.',
      });
    }
  }

  /**
   * GET /api/dashboard/employee
   * Employee only: Personal task metrics, pending assignments, due soon warnings, and progress charts
   */
  static async getEmployeeDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const stats = await DataService.getEmployeeDashboardStats(user.id);
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('Error compiling employee dashboard metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to compile employee dashboard analytics.',
      });
    }
  }
}

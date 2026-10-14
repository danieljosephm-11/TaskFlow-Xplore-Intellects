import { Response } from 'express';
import { DataService } from '../services/dataService.ts';
import { EmailService } from '../services/emailService.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';

export class NotificationController {
  /**
   * GET /api/notifications
   * List system email notifications with delivery status tracking
   */
  static async getNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const status = (req.query.status as string) || '';
      const recipient = (req.query.recipient as string) || '';

      const result = await DataService.getNotifications({
        page,
        limit,
        status,
        recipient,
      });

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve notification records.',
      });
    }
  }

  /**
   * POST /api/notifications/:id/retry
   * Admin only: Trigger delivery retry for a notification
   */
  static async retryNotification(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await EmailService.retryNotification(id);

      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.message,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to execute notification delivery retry.',
      });
    }
  }
}

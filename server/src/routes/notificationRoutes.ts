import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController.ts';
import { authenticate, requireAdmin } from '../middleware/auth.ts';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/', NotificationController.getNotifications);
router.post('/:id/retry', NotificationController.retryNotification);

export default router;

import { Router } from 'express';
import { DashboardController } from '../controllers/dashboardController.ts';
import { authenticate, requireAdmin, requireEmployee } from '../middleware/auth.ts';

const router = Router();

router.use(authenticate);

router.get('/admin', requireAdmin, DashboardController.getAdminDashboard);
router.get('/employee', requireEmployee, DashboardController.getEmployeeDashboard);

export default router;

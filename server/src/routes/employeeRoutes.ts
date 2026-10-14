import { Router } from 'express';
import { EmployeeController } from '../controllers/employeeController.ts';
import { authenticate, requireAdmin } from '../middleware/auth.ts';
import { validateEmployeeCreate } from '../middleware/validate.ts';

const router = Router();

// All employee management routes require authentication
router.use(authenticate);

// Get list of active employees (available for task creation modal)
router.get('/active', EmployeeController.getActiveEmployees);

// Admin-only management endpoints
router.get('/', requireAdmin, EmployeeController.getEmployees);
router.post('/', requireAdmin, validateEmployeeCreate, EmployeeController.createEmployee);
router.get('/:id', requireAdmin, EmployeeController.getEmployeeById);
router.put('/:id', requireAdmin, EmployeeController.updateEmployee);
router.patch('/:id/status', requireAdmin, EmployeeController.toggleStatus);

export default router;

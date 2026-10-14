import { Router } from 'express';
import { TaskController } from '../controllers/taskController.ts';
import { authenticate, requireAdmin } from '../middleware/auth.ts';
import { validateTaskCreate, validateTaskStatusUpdate } from '../middleware/validate.ts';

const router = Router();

// All task routes require authentication
router.use(authenticate);

router.get('/', TaskController.getTasks);
router.post('/', requireAdmin, validateTaskCreate, TaskController.createTask);
router.get('/:id', TaskController.getTaskById);
router.put('/:id', requireAdmin, TaskController.updateTask);
router.patch('/:id/status', validateTaskStatusUpdate, TaskController.updateTaskStatus);
router.delete('/:id', requireAdmin, TaskController.deleteTask);
router.get('/:id/activity', TaskController.getTaskActivity);

export default router;

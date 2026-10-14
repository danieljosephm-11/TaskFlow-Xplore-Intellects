import { Router } from 'express';
import { AuthController } from '../controllers/authController.ts';
import { authenticate } from '../middleware/auth.ts';
import { validateLogin } from '../middleware/validate.ts';

const router = Router();

router.post('/login', validateLogin, AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/me', authenticate, AuthController.getMe);

export default router;

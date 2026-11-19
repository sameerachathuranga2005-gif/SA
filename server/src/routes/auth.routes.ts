import { Router } from 'express';
import { AuthController, registerSchema, loginSchema } from '../controllers/auth.controller.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = Router();

// Public auth endpoints
router.post('/register', validateBody(registerSchema), AuthController.register);
router.post('/login', validateBody(loginSchema), AuthController.login);
router.post('/demo-login', AuthController.demoLogin);

// Protected auth endpoints
router.get('/me', protect, AuthController.getMe);

export default router;


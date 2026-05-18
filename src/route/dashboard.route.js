import { Router } from 'express';
import { showDashboard } from '../controller/dashboard.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/dashboard', requireAuth, showDashboard);

export default router;

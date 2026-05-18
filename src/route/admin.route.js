import { Router } from 'express';
import { showAdmin } from '../controller/admin.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';

const router = Router();

router.get('/admin', requireAuth, requireRole('ADMIN'), showAdmin);

export default router;

import { Router } from 'express';
import { showTransactionHistory } from '../controller/history.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';

const router = Router();

router.get(
    '/transactions',
    requireAuth,
    requireRole('CUSTOMER'),
    showTransactionHistory
);

export default router;
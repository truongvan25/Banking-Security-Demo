import { Router } from 'express';
import { showTransfer, doTransfer } from '../controller/transfer.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';

const router = Router();

router.get('/transfer',  requireAuth, requireRole('CUSTOMER'), showTransfer);
router.post('/transfer', requireAuth, requireRole('CUSTOMER'), doTransfer);

export default router;

import { Router } from 'express';
import { showAuditLogs } from '../controller/auditor.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';

const router = Router();

router.get('/audit', requireAuth, requireRole('ADMIN', 'AUDITOR'), showAuditLogs);

export default router;

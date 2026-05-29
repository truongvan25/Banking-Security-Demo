import { Router } from 'express';
import { attachCsrfToken } from '../middleware/csrf.middleware.js';
import {
    showVulnerable,
    vulnerableLogin, secureLogin,
    vulnerableSearch, secureSearch,
    vulnerableSearchById, secureSearchById,
    vulnerableBlind,
} from '../controller/vulnerable.controller.js';

const router = Router();

router.get('/vulnerable', showVulnerable);

router.post('/vulnerable/login',               attachCsrfToken, vulnerableLogin);
router.post('/vulnerable/secure-login',        attachCsrfToken, secureLogin);
router.post('/vulnerable/search',              attachCsrfToken, vulnerableSearch);
router.post('/vulnerable/secure-search',       attachCsrfToken, secureSearch);
router.post('/vulnerable/search-by-id',        attachCsrfToken, vulnerableSearchById);
router.post('/vulnerable/secure-search-by-id', attachCsrfToken, secureSearchById);
router.post('/vulnerable/blind',               attachCsrfToken, vulnerableBlind);

export default router;

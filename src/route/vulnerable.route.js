import { Router } from 'express';
import {
    showVulnerable,
    vulnerableLogin,
    vulnerableSearch,
    secureLogin,
    secureSearch,
} from '../controller/vulnerable.controller.js';

const router = Router();

router.get('/vulnerable', showVulnerable);
router.post('/vulnerable/login',         vulnerableLogin);
router.post('/vulnerable/search',        vulnerableSearch);
router.post('/vulnerable/secure-login',  secureLogin);
router.post('/vulnerable/secure-search', secureSearch);

export default router;

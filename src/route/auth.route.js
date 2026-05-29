import { Router } from 'express';
import { showLogin, login, logout } from '../controller/auth.controller.js';
import { loginLimiter } from '../middleware/rate-limit.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js'
import {
    doubleCsrfProtection,
    attachCsrfToken,
} from '../middleware/csrf.middleware.js';

const router = Router();

router.get('/login', showLogin);

/*
    Thứ tự xử lý:
    1. Kiểm tra CSRF token người dùng gửi lên.
    2. Tạo token mới để nếu login sai, trang login render lại vẫn submit được.
    3. Kiểm tra rate limit.
    4. Xử lý login.
*/
router.post(
    '/login',
    doubleCsrfProtection,
    attachCsrfToken,
    loginLimiter,
    login
);

/*
    Logout tạm giữ GET ở bước này.
    Sau khi Login CSRF chạy ổn, ta sẽ đổi Logout sang POST + CSRF.
*/
router.get('/logout', requireAuth, logout);

export default router;
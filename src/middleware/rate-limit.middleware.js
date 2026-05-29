import { rateLimit } from 'express-rate-limit';

export const loginLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,

    handler: (req, res) => {
        return res.status(429).render('login', {
            error: 'Quá nhiều lần đăng nhập thất bại từ thiết bị này. Vui lòng thử lại sau 10 phút.',
            redirect: '/dashboard',
        });
    },
});
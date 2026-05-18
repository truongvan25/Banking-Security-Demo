import jwt from 'jsonwebtoken';

export const requireAuth = (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) return res.redirect(`/login?redirect=${req.originalUrl}`);
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        res.clearCookie('token');
        res.redirect(`/login?redirect=${req.originalUrl}`);
    }
};

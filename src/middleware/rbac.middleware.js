import AuditLog from '../model/audit.model.js';

export const requireRole = (...roles) => async (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
        await AuditLog.create({
            event_type: 'UNAUTHORIZED_ACCESS',
            username:   req.user?.username || 'unknown',
            ip_address: req.ip,
            details:    `Tried to access ${req.originalUrl} with role ${req.user?.role}`,
        });
        return res.status(403).render('error', { message: 'Forbidden — không có quyền truy cập' });
    }
    next();
};

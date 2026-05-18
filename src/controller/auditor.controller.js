import AuditLog from '../model/audit.model.js';

export const showAuditLogs = async (req, res) => {
    const logs = await AuditLog.findAll({
        order: [['createdAt', 'DESC']],
        limit: 100,
    });
    res.render('audit', { logs });
};

export const requireDemoMode = (req, res, next) => {
    if (process.env.DEMO_MODE === 'true') {
        return next();
    }

    return res.status(404).render('error', {
        message: 'Chức năng security demo hiện đang bị tắt.',
    });
};
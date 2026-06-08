import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import sequelize from './config/db.js';

import './model/user.model.js';
import './model/account.model.js';
import './model/transaction.model.js';
import './model/audit.model.js';

import authRoute from './route/auth.route.js';
import dashboardRoute from './route/dashboard.route.js';
import adminRoute from './route/admin.route.js';
import auditorRoute from './route/auditor.route.js';
import vulnerableRoute from './route/vulnerable.route.js';
import transferRoute from './route/transfer.route.js';
import historyRoute from './route/history.route.js';
import { optionalAuth } from './middleware/auth.middleware.js';


import {
    ensureCsrfId,
    attachCsrfToken,
    csrfErrorHandler,
} from './middleware/csrf.middleware.js';

dotenv.config();

const app = express();

/*
    Không để lộ ứng dụng đang dùng Express.
*/
app.disable('x-powered-by');

/*
    Security Headers.
    Vì các file EJS hiện đang dùng <style> nội tuyến,
    tạm cho phép inline style để giao diện không bị mất CSS.
*/
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"], imgSrc: ["'self'", 'data:'],
            objectSrc: ["'none'"], baseUri: ["'self'"],
            formAction: ["'self'"], frameAncestors: ["'none'"],
        },
    },
    strictTransportSecurity: false,
}));

/*
    Parse dữ liệu request và giới hạn kích thước input.
*/
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

/*
    Bắt buộc đặt cookieParser trước middleware CSRF.
*/
app.use(cookieParser());

/*
    Tạo ID riêng cho trình duyệt để ràng buộc CSRF token.
*/
app.use(ensureCsrfId);

/*
    Với các trang GET, tạo CSRF token và đưa vào:
    res.locals.csrfToken

    Sau đó trong file EJS có thể dùng:
    <%= csrfToken %>
*/
app.use((req, res, next) => {
    if (req.method === 'GET') {
        return attachCsrfToken(req, res, next);
    }

    return next();
});

app.set('view engine', 'ejs');
app.set('views', './src/view');

/*
    Trang chủ nhận demoMode để sau này ẩn/hiện nút SQL Injection Demo.
*/
app.get('/', optionalAuth, (req, res) => {
    res.render('home', {
        demoMode: process.env.DEMO_MODE === 'true',
        user: req.user || null,
    });
});


/*
    Routes.
*/
app.use('/', authRoute);
app.use('/', dashboardRoute);
app.use('/', adminRoute);
app.use('/', auditorRoute);
app.use('/', vulnerableRoute);
app.use('/', transferRoute);
app.use('/', historyRoute);

/*
    Bắt lỗi CSRF token không hợp lệ.
    Phải đặt sau các route.
*/
app.use(csrfErrorHandler);

const PORT = process.env.PORT || 3000;

sequelize.sync()
    .then(() => {
        console.log('Database synced');

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('DB connection failed:', err);
    });
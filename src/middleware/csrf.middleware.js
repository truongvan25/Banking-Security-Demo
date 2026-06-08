import dotenv from 'dotenv';
import { randomUUID } from 'node:crypto';
import { doubleCsrf } from 'csrf-csrf';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const CSRF_ID_COOKIE = 'bank_csrf_id';

const CSRF_TOKEN_COOKIE = isProduction
    ? '__Host-bank_csrf_token'
    : 'bank_csrf_token';

const cookieOptions = {
    httpOnly: true,
    sameSite: 'strict',
    secure: isProduction,
    path: '/',
    maxAge: 60 * 60 * 1000,
};

/*
    Mỗi trình duyệt được gắn một ID riêng.
    ID này dùng để ràng buộc CSRF token với đúng trình duyệt hiện tại.
*/
export const ensureCsrfId = (req, res, next) => {
    let csrfId = req.cookies[CSRF_ID_COOKIE];

    if (!csrfId) {
        csrfId = randomUUID();

        res.cookie(CSRF_ID_COOKIE, csrfId, cookieOptions);

        /*
            Cookie mới chỉ thực sự về trình duyệt sau response.
            Gán vào req.cookies để request hiện tại dùng được ngay.
        */
        req.cookies[CSRF_ID_COOKIE] = csrfId;
    }

    next();
};

const { generateCsrfToken, doubleCsrfProtection} = doubleCsrf({
    getSecret: () => process.env.CSRF_SECRET,
    getSessionIdentifier: (req) => req.cookies[CSRF_ID_COOKIE],
    cookieName: CSRF_TOKEN_COOKIE,
    cookieOptions,
    ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
    getCsrfTokenFromRequest: (req) => req.body._csrf,
});

export { doubleCsrfProtection };

/*
    Dùng trên các trang GET có form.
    Token sẽ được truyền sang EJS bằng biến csrfToken.
*/
export const attachCsrfToken = (req, res, next) => {
    res.locals.csrfToken = generateCsrfToken(req, res);
    next();
};

/*
    Khi login/logout thành công, đổi ngữ cảnh CSRF.
    Token cũ không tiếp tục dùng được cho phiên sau.
*/
export const rotateCsrfContext = (req, res) => {
    const newCsrfId = randomUUID();
    res.cookie(CSRF_ID_COOKIE, newCsrfId, cookieOptions);
    res.clearCookie(CSRF_TOKEN_COOKIE, cookieOptions);
};

/*
    Xử lý lỗi token không hợp lệ.
*/
export const csrfErrorHandler = (err, req, res, next) => {
    if (err && err.code === 'EBADCSRFTOKEN') {
        return res.status(403).render('error', {
            message: 'Yêu cầu bị từ chối vì CSRF token không hợp lệ hoặc đã hết hạn.',
        });
    }

    next(err);
};
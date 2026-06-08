import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../model/user.model.js';
import AuditLog from '../model/audit.model.js';
import { rotateCsrfContext } from '../middleware/csrf.middleware.js';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 5;

const getSafeRedirect = (req) => {
    const requestedRedirect = req.query.redirect;

    if (
        requestedRedirect &&
        requestedRedirect.startsWith('/') &&
        !requestedRedirect.startsWith('//')
    ) {
        return requestedRedirect;
    }

    return '/dashboard';
};

export const showLogin = (req, res) => {
    res.render('login', {
        error: null,
        redirect: req.query.redirect || '/dashboard',
    });
};

export const login = async (req, res) => {
    const { username, password } = req.body;
    const redirect = getSafeRedirect(req);

    try {
        const user = await User.findOne({
            where: { username },
        });

        /*
            Không báo rõ username có tồn tại hay không
            để tránh lộ thông tin tài khoản.
        */
        if (!user) {
            await AuditLog.create({
                event_type: 'LOGIN_FAIL',
                username: username || 'unknown',
                ip_address: req.ip,
                details: 'Invalid credentials - username not found',
            });

            return res.render('login', {
                error: 'Sai tên đăng nhập hoặc mật khẩu',
                redirect,
            });
        }

        /*
            Trường hợp Admin chủ động khóa tài khoản.
        */
        if (!user.is_active) {
            await AuditLog.create({
                event_type: 'LOGIN_BLOCKED',
                username: user.username,
                ip_address: req.ip,
                details: 'Account disabled by administrator',
            });

            return res.render('login', {
                error: 'Tài khoản đã bị khóa bởi quản trị viên',
                redirect,
            });
        }

        /*
            Trường hợp tài khoản đang bị khóa tạm thời
            vì nhập sai quá nhiều lần.
        */
        if (user.locked_until && new Date(user.locked_until) > new Date()) {
            const remainingSeconds = Math.ceil(
                (new Date(user.locked_until).getTime() - Date.now()) / 1000
            );

            const remainingMinutes = Math.ceil(remainingSeconds / 60);

            await AuditLog.create({
                event_type: 'LOGIN_BLOCKED',
                username: user.username,
                ip_address: req.ip,
                details: `Temporary lock active. Remaining approximately ${remainingMinutes} minute(s)`,
            });

            return res.render('login', {
                error: `Tài khoản đang bị khóa tạm thời. Vui lòng thử lại sau ${remainingMinutes} phút.`,
                redirect,
            });
        }

        /*
            Nếu thời gian khóa đã hết thì reset trạng thái khóa.
        */
        if (user.locked_until && new Date(user.locked_until) <= new Date()) {
            await user.update({
                failed_login_attempts: 0,
                locked_until: null,
            });
        }

        const passwordValid = bcrypt.compareSync(password, user.password_hash);

        /*
            Sai mật khẩu: tăng số lần thất bại.
        */
        if (!passwordValid) {
            const nextAttempts = Number(user.failed_login_attempts || 0) + 1;

            if (nextAttempts >= MAX_FAILED_ATTEMPTS) {
                const lockedUntil = new Date(
                    Date.now() + LOCK_DURATION_MINUTES * 60 * 1000
                );

                await user.update({
                    failed_login_attempts: 0,
                    locked_until: lockedUntil,
                });

                await AuditLog.create({
                    event_type: 'ACCOUNT_TEMPORARILY_LOCKED',
                    username: user.username,
                    ip_address: req.ip,
                    details: `Account locked for ${LOCK_DURATION_MINUTES} minutes after ${MAX_FAILED_ATTEMPTS} failed login attempts`,
                });

                return res.render('login', {
                    error: `Bạn đã nhập sai ${MAX_FAILED_ATTEMPTS} lần. Tài khoản bị khóa trong ${LOCK_DURATION_MINUTES} phút.`,
                    redirect,
                });
            }

            await user.update({
                failed_login_attempts: nextAttempts,
            });

            await AuditLog.create({
                event_type: 'LOGIN_FAIL',
                username: user.username,
                ip_address: req.ip,
                details: `Invalid password. Failed attempt ${nextAttempts}/${MAX_FAILED_ATTEMPTS}`,
            });

            return res.render('login', {
                error: `Sai tên đăng nhập hoặc mật khẩu. Bạn còn ${MAX_FAILED_ATTEMPTS - nextAttempts} lần thử.`,
                redirect,
            });
        }

        /*
            Đăng nhập thành công: reset số lần sai và trạng thái khóa.
        */
        await user.update({
            failed_login_attempts: 0,
            locked_until: null,
        });

        await AuditLog.create({
            event_type: 'LOGIN_SUCCESS',
            username: user.username,
            ip_address: req.ip,
            details: `Role: ${user.role}`,
        });

        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                role: user.role,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '1h',
            }
        );

        res.cookie('token', token, {
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 1000,
        });

        return res.redirect(redirect);
        } catch (err) {
            console.error(err);

        return res.render('login', {
            error: 'Lỗi server',
            redirect,
        });
    }
};

export const logout = async (req, res) => {
    const username = req.user?.username || 'unknown';

    await AuditLog.create({
        event_type: 'LOGOUT',
        username,
        ip_address: req.ip,
        details:    'User logged out',
    });

    res.clearCookie('token', {
        httpOnly: true,
        sameSite: 'strict',
        secure:   process.env.NODE_ENV === 'production',
        path:     '/',
    });

    rotateCsrfContext(req, res);

    res.redirect('/login');
};
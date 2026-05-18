import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../model/user.model.js';
import AuditLog from '../model/audit.model.js';

export const showLogin = (req, res) => {
    res.render('login', { 
        error: null ,
        redirect: req.query.redirect || '/dashboard' });
};

export const login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ where: { username } });

        if (!user || !bcrypt.compareSync(password, user.password_hash)) {
            await AuditLog.create({
                event_type: 'LOGIN_FAIL',
                username,
                ip_address: req.ip,
                details: 'Invalid credentials',
            });
            return res.render('login', { error: 'Sai tên đăng nhập hoặc mật khẩu' });
        }

        await AuditLog.create({
            event_type: 'LOGIN_SUCCESS',
            username,
            ip_address: req.ip,
            details: `Role: ${user.role}`,
        });

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.cookie('token', token, { httpOnly: true });
        const redirect = req.query.redirect || '/dashboard';
        res.redirect(redirect);
    } catch (err) {
        console.error(err);
        res.render('login', { error: 'Lỗi server' });
    }
};

export const logout = (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
};

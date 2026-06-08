import connection from '../config/db-raw.js';
import User from '../model/user.model.js';
import AuditLog from '../model/audit.model.js';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';

const containsSqlInjectionPattern = (value = '') => {
    const pattern = /('|\bOR\b|\bUNION\b|\bSELECT\b|--|#|;)/i;
    return pattern.test(value);
};

export const showVulnerable = (req, res) => {
    res.render('vulnerable', {
        loginResult: null, searchResult: null,
        loginQuery: null,  searchQuery: null,
        idResult: null,    idQuery: null,
        blindResult: null, blindQuery: null,
        blindElapsed: null,
        mode: null,
    });
};

/*
    Vulnerable Login:
    Cố ý nối trực tiếp input vào SQL để minh họa SQL Injection.
*/
export const vulnerableLogin = async (req, res) => {
    const { username, password } = req.body;

    const sql = `SELECT * FROM users WHERE username='${username}' AND password_hash='${password}'`;

    try {
        if (
            containsSqlInjectionPattern(username) ||
            containsSqlInjectionPattern(password)
        ) {
            await AuditLog.create({
                event_type: 'SQL_INJECTION_ATTEMPT',
                username: username || 'anonymous',
                ip_address: req.ip,
                details: 'Suspicious payload detected in vulnerable login demo',
            });
        }

        connection.query(sql, (err, results) => {
            res.render('vulnerable', {
                loginResult: err ? `SQL Error: ${err.sqlMessage}` : results,
                searchResult: null,
                loginQuery: sql,
                searchQuery: null,
                mode: 'login',
            });
        });
    } catch (err) {
        console.error(err);

        res.render('vulnerable', {
            loginResult: `Error: ${err.message}`,
            searchResult: null,
            loginQuery: sql,
            searchQuery: null,
            mode: 'login',
        });
    }
};

/*
    Vulnerable Search:
    Cố ý ghép chuỗi SQL để minh họa truy vấn độc hại.
*/
export const vulnerableSearch = async (req, res) => {
    const { name } = req.body;

    const sql = `SELECT id, username, role FROM users WHERE username LIKE '%${name}%'`;

    try {
        if (containsSqlInjectionPattern(name)) {
            await AuditLog.create({
                event_type: 'SQL_INJECTION_ATTEMPT',
                username: 'anonymous',
                ip_address: req.ip,
                details: 'Suspicious payload detected in vulnerable search demo',
            });
        }

        connection.query(sql, (err, results) => {
            res.render('vulnerable', {
                loginResult: null,
                searchResult: err ? `SQL Error: ${err.sqlMessage}` : results,
                loginQuery: null,
                searchQuery: sql,
                mode: 'search',
            });
        });
    } catch (err) {
        console.error(err);

        res.render('vulnerable', {
            loginResult: null,
            searchResult: `Error: ${err.message}`,
            loginQuery: null,
            searchQuery: sql,
            mode: 'search',
        });
    }
};

/*
    Secure Login:
    Dùng Sequelize và BCrypt, không ghép input vào raw SQL.
*/
export const secureLogin = async (req, res) => {
    const { username, password } = req.body;

    const displayedSql =
        'SELECT * FROM users WHERE username = ? AND password_hash = BCrypt(?)';

    try {
        const user = await User.findOne({
            where: { username },
        });

        const passwordValid =
            user && bcrypt.compareSync(password, user.password_hash);

        const result = passwordValid
            ? [{
                id: user.id,
                username: user.username,
                role: user.role,
            }]
            : [];

        await AuditLog.create({
            event_type: passwordValid
                ? 'SECURE_LOGIN_SUCCESS'
                : 'SECURE_LOGIN_FAIL',
            username: username || 'unknown',
            ip_address: req.ip,
            details: passwordValid
                ? 'Secure login demo accepted valid credentials'
                : 'Secure login demo rejected invalid credentials or malicious payload',
        });

        res.render('vulnerable', {
            loginResult: result,
            searchResult: null,
            loginQuery: displayedSql,
            searchQuery: null,
            mode: 'secure-login',
        });
    } catch (err) {
        console.error(err);

        res.render('vulnerable', {
            loginResult: `Error: ${err.message}`,
            searchResult: null,
            loginQuery: displayedSql,
            searchQuery: null,
            mode: 'secure-login',
        });
    }
};

/*
    Secure Search:
    Dùng Sequelize thay cho raw SQL.
*/
export const secureSearch = async (req, res) => {
    const { name } = req.body;

    const displayedSql =
        'SELECT id, username, role FROM users WHERE username LIKE ?';

    try {
        const users = await User.findAll({
            attributes: ['id', 'username', 'role'],
            where: {
                username: {
                    [Op.like]: `%${name}%`,
                },
            },
        });

        res.render('vulnerable', {
            loginResult: null,
            searchResult: users,
            loginQuery: null,
            searchQuery: displayedSql,
            mode: 'secure-search',
        });
    } catch (err) {
        console.error(err);

        res.render('vulnerable', {
            loginResult: null,
            searchResult: `Error: ${err.message}`,
            loginQuery: null,
            searchQuery: displayedSql,
            mode: 'secure-search',
        });
    }
};

export const vulnerableSearchById = async (req, res) => {
    const { user_id } = req.body;
    
    const sql = `SELECT id, username, role FROM users WHERE id = ${user_id}`;

    if (containsSqlInjectionPattern(user_id)) {
        await AuditLog.create({
            event_type: 'SQL_INJECTION_ATTEMPT',
            username: 'anonymous',
            ip_address: req.ip,
            details: 'Suspicious payload in vulnerable ID search demo',
        });
    }

    connection.query(sql, (err, results) => {
        res.render('vulnerable', {
            loginResult: null, searchResult: null,
            idResult: err ? `SQL Error: ${err.sqlMessage}` : results,
            idQuery: sql,
            loginQuery: null, searchQuery: null,
            blindResult: null, blindQuery: null,
            mode: 'id-search',
        });
    });
};

export const secureSearchById = async (req, res) => {
    const { user_id } = req.body;
    const displayedSql = 'SELECT id, username, role FROM users WHERE id = ?';

    const users = await User.findAll({
        attributes: ['id', 'username', 'role'],
        where: { id: user_id },
    });

    res.render('vulnerable', {
        loginResult: null, searchResult: null,
        idResult: users,
        idQuery: displayedSql,
        loginQuery: null, searchQuery: null,
        blindResult: null, blindQuery: null,
        mode: 'secure-id-search',
    });
};

export const vulnerableBlind = async (req, res) => {
    const { payload } = req.body;
    const sql = `SELECT id FROM users WHERE username = '${payload}'`;
    const start = Date.now();

    if (containsSqlInjectionPattern(payload)) {
        await AuditLog.create({
            event_type: 'SQL_INJECTION_ATTEMPT',
            username: 'anonymous',
            ip_address: req.ip,
            details: 'Time-based blind injection attempt detected',
        });
    }

    connection.query(sql, (err, results) => {
        const elapsed = Date.now() - start;
        res.render('vulnerable', {
            loginResult: null, searchResult: null,
            idResult: null, idQuery: null,
            loginQuery: null, searchQuery: null,
            blindResult: err
                ? `SQL Error: ${err.sqlMessage}`
                : `Trả về ${results.length} kết quả`,
            blindQuery: sql,
            blindElapsed: elapsed,
            mode: 'blind',
        });
    });
};
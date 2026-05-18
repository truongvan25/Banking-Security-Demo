import connection from '../config/db-raw.js';
import User from '../model/user.model.js';
import { Op } from 'sequelize';

export const showVulnerable = (req, res) => {
    res.render('vulnerable', {
        loginResult:  null,
        searchResult: null,
        loginQuery:   null,
        searchQuery:  null,
        mode:         null,
    });
};

export const vulnerableLogin = (req, res) => {
    const { username, password } = req.body;
    const sql = `SELECT * FROM users WHERE username='${username}' AND password_hash='${password}'`;

    connection.query(sql, (err, results) => {
        res.render('vulnerable', {
            loginResult:  err ? `SQL Error: ${err.sqlMessage}` : results,
            searchResult: null,
            loginQuery:   sql,
            searchQuery:  null,
            mode:         'login',
        });
    });
}

export const vulnerableSearch = (req, res) => {
    const { name } = req.body;
    const sql = `SELECT id, username, role FROM users WHERE username LIKE '%${name}%'`;

    connection.query(sql, (err, results) => {
        res.render('vulnerable', {
            loginResult:  null,
            searchResult: err ? `SQL Error: ${err.sqlMessage}` : results,
            loginQuery:   null,
            searchQuery:  sql,
            mode:         'search',
        });
    });
};


export const secureLogin = async (req, res) => {
    const { username, password } = req.body;
    const sql = `SELECT * FROM users WHERE username = ? AND password_hash = ?`;

    try {
        const user = await User.findOne({ where: { username } });
        const result = user
            ? [{ id: user.id, username: user.username, role: user.role }]
            : [];

        res.render('vulnerable', {
            loginResult:  result,
            searchResult: null,
            loginQuery:   sql,
            searchQuery:  null,
            mode:         'secure-login',
        });
    } catch (err) {
        res.render('vulnerable', {
            loginResult:  `Error: ${err.message}`,
            searchResult: null,
            loginQuery:   sql,
            searchQuery:  null,
            mode:         'secure-login',
        });
    }
};


export const secureSearch = async (req, res) => {
    const { name } = req.body;
    const sql = `SELECT id, username, role FROM users WHERE username LIKE ?`;

    const users = await User.findAll({
        attributes: ['id', 'username', 'role'],
        where: { username: { [Op.like]: `%${name}%` } },
    });

    res.render('vulnerable', {
        loginResult:  null,
        searchResult: users,
        loginQuery:   null,
        searchQuery:  sql,
        mode:         'secure-search',
    });
};

import bcrypt from 'bcryptjs';
import sequelize from './config/db.js';
import User from './model/user.model.js';
import Account from './model/account.model.js';

await sequelize.sync({ alter: true });

const users = [
    { username: 'admin',   password: 'admin123',   role: 'ADMIN' },
    { username: 'auditor', password: 'audit123',   role: 'AUDITOR' },
    { username: 'alice',   password: 'alice123',   role: 'CUSTOMER' },
    { username: 'bob',     password: 'bob123',     role: 'CUSTOMER' },
];

for (const u of users) {
    const password_hash = bcrypt.hashSync(u.password, 10);
    const user = await User.create({ username: u.username, password_hash, role: u.role });

    if (u.role === 'CUSTOMER') {
        await Account.create({
            user_id: user.id,
            balance: Math.floor(Math.random() * 10000) + 1000,
        });
    }
}

console.log('Seed done!');
process.exit(0);

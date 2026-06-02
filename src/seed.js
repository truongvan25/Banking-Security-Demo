import bcrypt from 'bcryptjs';
import sequelize from './config/db.js';
import User from './model/user.model.js';
import Account from './model/account.model.js';
import Transaction from './model/transaction.model.js';
import AuditLog from './model/audit.model.js';

await sequelize.sync();

// Xóa data cũ theo thứ tự tránh lỗi foreign key
await AuditLog.destroy({ where: {} });
await Transaction.destroy({ where: {} });
await Account.destroy({ where: {} });
await User.destroy({ where: {} });

// Tạo users — đủ các field mới
const users = [
    { username: 'admin',   password: 'admin123', role: 'ADMIN' },
    { username: 'auditor', password: 'audit123', role: 'AUDITOR' },
    { username: 'alice',   password: 'alice123', role: 'CUSTOMER' },
    { username: 'bob',     password: 'bob123',   role: 'CUSTOMER' },
];

const created = {};

for (const u of users) {
    const password_hash = bcrypt.hashSync(u.password, 10);
    created[u.username] = await User.create({
        username:               u.username,
        password_hash,
        role:                   u.role,
        failed_login_attempts:  0,
        locked_until:           null,
        is_active:              true,
    });
}

// Tạo accounts cho CUSTOMER
const aliceAccount = await Account.create({ user_id: created['alice'].id, balance: 5000000 });
const bobAccount   = await Account.create({ user_id: created['bob'].id,   balance: 3000000 });

// Tạo vài transaction mẫu để demo audit log
await Transaction.create({ from_account: aliceAccount.id, to_account: bobAccount.id, amount: 500000 });
await Transaction.create({ from_account: bobAccount.id,   to_account: aliceAccount.id, amount: 200000 });

console.log('Seed done!');
console.log('Alice balance:', aliceAccount.balance, 'VNĐ — Account ID:', aliceAccount.id);
console.log('Bob balance:  ', bobAccount.balance,   'VNĐ — Account ID:', bobAccount.id);
process.exit(0);

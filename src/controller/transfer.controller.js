import Account from '../model/account.model.js';
import Transaction from '../model/transaction.model.js';
import AuditLog from '../model/audit.model.js';
import sequelize from '../config/db.js';

export const showTransfer = async (req, res) => {
    const account = await Account.findOne({ where: { user_id: req.user.id } });
    res.render('transfer', { account, success: null, error: null });
};

export const doTransfer = async (req, res) => {
    const { to_account_id, amount } = req.body;
    const parsedAmount = parseFloat(amount);

    const senderAccount = await Account.findOne({ where: { user_id: req.user.id } });

    // Validation
    if (!senderAccount)
        return res.render('transfer', { account: null, success: null, error: 'Không tìm thấy tài khoản của bạn' });

    if (senderAccount.id === parseInt(to_account_id))
        return res.render('transfer', { account: senderAccount, success: null, error: 'Không thể chuyển cho chính mình' });

    if (parsedAmount <= 0 || isNaN(parsedAmount))
        return res.render('transfer', { account: senderAccount, success: null, error: 'Số tiền không hợp lệ' });

    if (parseFloat(senderAccount.balance) < parsedAmount)
        return res.render('transfer', { account: senderAccount, success: null, error: 'Số dư không đủ' });

    const receiverAccount = await Account.findByPk(parseInt(to_account_id));
    if (!receiverAccount)
        return res.render('transfer', { account: senderAccount, success: null, error: 'Tài khoản nhận không tồn tại' });

    // Transaction — rollback nếu lỗi
    const t = await sequelize.transaction();
    try {
        await senderAccount.decrement('balance', { by: parsedAmount, transaction: t });
        await receiverAccount.increment('balance', { by: parsedAmount, transaction: t });
        await Transaction.create({
            from_account: senderAccount.id,
            to_account:   receiverAccount.id,
            amount:       parsedAmount,
        }, { transaction: t });

        await t.commit();

        await AuditLog.create({
            event_type: 'TRANSFER',
            username:   req.user.username,
            ip_address: req.ip,
            details:    `Chuyển ${parsedAmount.toLocaleString('vi-VN')} VNĐ → account #${receiverAccount.id}`,
        });

        await senderAccount.reload();
        res.render('transfer', {
            account: senderAccount,
            success: `Chuyển thành công ${parsedAmount.toLocaleString('vi-VN')} VNĐ đến tài khoản #${receiverAccount.id}`,
            error: null,
        });
    } catch (err) {
        await t.rollback();
        console.error(err);
        res.render('transfer', { account: senderAccount, success: null, error: 'Lỗi server khi thực hiện giao dịch' });
    }
};

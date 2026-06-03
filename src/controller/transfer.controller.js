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
    const receiverId = parseInt(to_account_id);

    const t = await sequelize.transaction();

    try {
        const senderAccount = await Account.findOne({
            where: { user_id: req.user.id },
            transaction: t,
            lock: t.LOCK.UPDATE
        });

        if (!senderAccount) {
            await t.rollback();
            return res.render('transfer', {
                account: null,
                success: null,
                error: 'Không tìm thấy tài khoản của bạn'
            });
        }

        if (senderAccount.id === receiverId) {
            await t.rollback();
            return res.render('transfer', {
                account: senderAccount,
                success: null,
                error: 'Không thể chuyển cho chính mình'
            });
        }

        if (parsedAmount <= 0 || isNaN(parsedAmount)) {
            await t.rollback();
            return res.render('transfer', {
                account: senderAccount,
                success: null,
                error: 'Số tiền không hợp lệ'
            });
        }

        if (parsedAmount > 100000000) {
            await t.rollback();
            return res.render('transfer', {
                account: senderAccount,
                success: null,
                error: 'Số tiền chuyển vượt quá giới hạn cho phép'
            });
        }

        const receiverAccount = await Account.findByPk(receiverId, {
            transaction: t,
            lock: t.LOCK.UPDATE
        });

        if (!receiverAccount) {
            await t.rollback();
            return res.render('transfer', {
                account: senderAccount,
                success: null,
                error: 'Tài khoản nhận không tồn tại'
            });
        }

        if (parseFloat(senderAccount.balance) < parsedAmount) {
            await t.rollback();
            return res.render('transfer', {
                account: senderAccount,
                success: null,
                error: 'Số dư không đủ'
            });
        }

        await senderAccount.decrement('balance', {
            by: parsedAmount,
            transaction: t
        });

        await receiverAccount.increment('balance', {
            by: parsedAmount,
            transaction: t
        });

        await Transaction.create({
            from_account: senderAccount.id,
            to_account: receiverAccount.id,
            amount: parsedAmount
        }, { transaction: t });

        await AuditLog.create({
            event_type: 'TRANSFER',
            username: req.user.username,
            ip_address: req.ip,
            details: `Chuyển ${parsedAmount.toLocaleString('vi-VN')} VNĐ → account #${receiverAccount.id}`
        }, { transaction: t });

        await t.commit();

        await senderAccount.reload();

        res.render('transfer', {
            account: senderAccount,
            success: `Chuyển thành công ${parsedAmount.toLocaleString('vi-VN')} VNĐ đến tài khoản #${receiverAccount.id}`,
            error: null
        });

    } catch (err) {
        if (!t.finished) {
            await t.rollback();
        }   
        console.error(err);

        const account = await Account.findOne({
            where: { user_id: req.user.id }
        });

        res.render('transfer', {
            account,
            success: null,
            error: 'Lỗi server khi thực hiện giao dịch'
        });
    }
};
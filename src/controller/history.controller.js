import { Op } from 'sequelize';
import Account from '../model/account.model.js';
import Transaction from '../model/transaction.model.js';

export const showTransactionHistory = async (req, res) => {
    try {
        const account = await Account.findOne({
            where: { user_id: req.user.id },
        });

        if (!account) {
            return res.status(404).render('error', {
                message: 'Không tìm thấy tài khoản ngân hàng của bạn',
            });
        }

        const transactions = await Transaction.findAll({
            where: {
                [Op.or]: [
                    { from_account: account.id },
                    { to_account: account.id },
                ],
            },
            order: [['createdAt', 'DESC']],
        });

        res.render('history', {
            account,
            transactions,
            username: req.user.username,
        });
    } catch (err) {
        console.error(err);

        res.status(500).render('error', {
            message: 'Không thể tải lịch sử giao dịch',
        });
    }
};
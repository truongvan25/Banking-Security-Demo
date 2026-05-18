import User from '../model/user.model.js';
import Account from '../model/account.model.js';
import Transaction from '../model/transaction.model.js';

export const showDashboard = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            include: [{ model: Account }],
        });

        res.render('dashboard', { user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};

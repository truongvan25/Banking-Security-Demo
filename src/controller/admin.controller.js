import User from '../model/user.model.js';
import Account from '../model/account.model.js';

export const showAdmin = async (req, res) => {
    const users = await User.findAll({
        include: [{ model: Account }],
        order: [['createdAt', 'DESC']],
    });
    res.render('admin', { users, currentUser: req.user });
};

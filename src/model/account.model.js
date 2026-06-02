import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import User from './user.model.js';

const Account = sequelize.define('Account', {
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {model: 'users', key: 'id'}
    },
    balance: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
    },
}, { tableName: 'accounts', timestamps: false });

Account.belongsTo(User, { foreignKey: 'user_id' });
User.hasOne(Account, { foreignKey: 'user_id' });

export default Account;

import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import Account from './account.model.js';

const Transaction = sequelize.define('Transaction', {
    from_account: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {model: 'accounts', key: 'id'}
    },
    to_account:   {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {model: 'accounts', key: 'id'}
    },
    amount:       DataTypes.DECIMAL(15, 2),
}, { tableName: 'transactions', timestamps: true });

Transaction.belongsTo(Account, {foreignKey: 'from_account', as: 'sender'})
Transaction.belongsTo(Account, {foreignKey: 'to_account', as: 'receiver'})
Account.hasMany(Transaction, {foreignKey: 'from_account', as: 'sentTransactions'})
Account.hasMany(Transaction, {foreignKey: 'to_account', as: 'receivedTransactions'})

export default Transaction;

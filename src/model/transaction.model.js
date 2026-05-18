import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Transaction = sequelize.define('Transaction', {
    from_account: DataTypes.INTEGER,
    to_account:   DataTypes.INTEGER,
    amount:       DataTypes.DECIMAL(15, 2),
}, { tableName: 'transactions', timestamps: true });

export default Transaction;

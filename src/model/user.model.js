import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const User = sequelize.define('User', {
    username: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
    },
    password_hash: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: DataTypes.ENUM('CUSTOMER', 'ADMIN', 'AUDITOR'),
        allowNull: false,
    },
}, { tableName: 'users', timestamps: true });

export default User;

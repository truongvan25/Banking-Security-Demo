import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import User from './user.model.js';

const AuditLog = sequelize.define('AuditLog', {
    event_type: DataTypes.STRING,
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' } 
    },
    username:   {
        type: DataTypes.STRING,
        allowNull:true
    },
    ip_address: DataTypes.STRING,
    details:    DataTypes.TEXT,
}, { tableName: 'audit_logs', timestamps: true });

AuditLog.belongsTo(User, {foreignKey: 'user_id'})
User.hasMany(AuditLog, {foreignKey: 'user_id'})

export default AuditLog;

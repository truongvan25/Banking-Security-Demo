import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const AuditLog = sequelize.define('AuditLog', {
    event_type: DataTypes.STRING,
    username:   DataTypes.STRING,
    ip_address: DataTypes.STRING,
    details:    DataTypes.TEXT,
}, { tableName: 'audit_logs', timestamps: true });

export default AuditLog;

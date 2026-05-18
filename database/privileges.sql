

USE banking;


-- TẠO 4 MySQL USERS


CREATE USER IF NOT EXISTS 'app_customer'@'localhost'  IDENTIFIED BY 'cust_pass123';
CREATE USER IF NOT EXISTS 'app_auditor'@'localhost'   IDENTIFIED BY 'audit_pass123';
CREATE USER IF NOT EXISTS 'app_admin'@'localhost'     IDENTIFIED BY 'admin_pass123';
CREATE USER IF NOT EXISTS 'app_vulnerable'@'localhost' IDENTIFIED BY 'vuln_pass123';


-- CUSTOMER: chỉ xem/thao tác data của mình
-- Không được đọc bảng users (thông tin nhạy cảm)

GRANT SELECT, INSERT ON banking.transactions TO 'app_customer'@'localhost';
GRANT SELECT, UPDATE ON banking.accounts     TO 'app_customer'@'localhost';


-- AUDITOR: read-only toàn bộ, không được sửa gì

GRANT SELECT ON banking.users        TO 'app_auditor'@'localhost';
GRANT SELECT ON banking.accounts     TO 'app_auditor'@'localhost';
GRANT SELECT ON banking.transactions TO 'app_auditor'@'localhost';
GRANT SELECT ON banking.audit_logs   TO 'app_auditor'@'localhost';


-- ADMIN: quản lý users và accounts, không chuyển tiền

GRANT SELECT, INSERT, UPDATE, DELETE ON banking.users      TO 'app_admin'@'localhost';
GRANT SELECT, INSERT, UPDATE         ON banking.accounts   TO 'app_admin'@'localhost';
GRANT SELECT                         ON banking.audit_logs TO 'app_admin'@'localhost';


-- VULNERABLE: full quyền — dùng cho demo tấn công
-- Để thấy hậu quả khi không áp dụng least-privilege

GRANT ALL PRIVILEGES ON banking.* TO 'app_vulnerable'@'localhost';

FLUSH PRIVILEGES;

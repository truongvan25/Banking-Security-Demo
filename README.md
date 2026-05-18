# Mini Online Banking — Database Security Demo

## Mục đích

Hệ thống ngân hàng thu nhỏ được xây dựng để **minh họa và kiểm thử các cơ chế bảo mật cơ sở dữ liệu**, bao gồm:

- SQL Injection — tấn công và phòng chống
- Role-Based Access Control (RBAC)
- Least-Privilege Principle
- BCrypt password hashing
- Audit Logging

> Đây là môi trường demo — không dùng cho production.

---

## Tech Stack

| Thành phần | Công nghệ |
|---|---|
| Backend | Node.js + Express |
| ORM (secure) | Sequelize |
| Raw query (vulnerable demo) | mysql2 |
| Database | MySQL 8.x |
| Password hashing | bcryptjs |
| Authentication | JWT + cookie |
| Template engine | EJS |

---

## Cấu trúc project

```
src/
  app.js                  ← Entry point
  seed.js                 ← Tạo dữ liệu test
  config/
    db.js                 ← Sequelize connection (main)
    db-raw.js             ← mysql2 connection (vulnerable demo)
  model/                  ← Database models
  controller/             ← Business logic
  route/                  ← Route definitions
  middleware/
    auth.middleware.js    ← JWT verification
    rbac.middleware.js    ← Role checking
  view/                   ← EJS templates
database/
  privileges.sql          ← MySQL least-privilege setup
  verify-privileges.sql   ← Kiểm tra quyền
```

---

## Hướng dẫn cài đặt và chạy

### Yêu cầu

- Node.js >= 18
- MySQL 8.x

### Bước 1 — Clone và cài dependencies

```bash
git clone https://github.com/truongvan25/Banking-Security-Demo.git
cd Banking-Security
npm install
```

### Bước 2 — Tạo database

Mở MySQL Workbench hoặc terminal MySQL, chạy:

```sql
CREATE DATABASE IF NOT EXISTS banking;
```

### Bước 3 — Cấu hình `.env`

Tạo file `.env` ở root:

```env
PORT=8080
DB_HOST=localhost
DB_PORT=3306
DB_NAME=banking
DB_USER=root
DB_PASS=your_mysql_password
JWT_SECRET=your_secret_key

# Least-privilege users
DB_CUSTOMER_USER=app_customer
DB_CUSTOMER_PASS=cust_pass123
DB_AUDITOR_USER=app_auditor
DB_AUDITOR_PASS=audit_pass123
DB_ADMIN_USER=app_admin
DB_ADMIN_PASS=admin_pass123
DB_VULN_USER=app_vulnerable
DB_VULN_PASS=vuln_pass123
```

### Bước 4 — Setup least-privilege MySQL users

Mở MySQL Workbench, mở file `database/privileges.sql` và Execute.

Kiểm tra đã tạo đúng chưa:

```sql
SELECT user, host FROM mysql.user WHERE user LIKE 'app_%';
```

### Bước 5 — Tạo dữ liệu test (seed)

```bash
npm run seed
```

### Bước 6 — Chạy server

```bash
npm run dev
```

Truy cập: `http://localhost:8080`

### Tài khoản test

| Username | Password | Role |
|---|---|---|
| `admin` | `admin123` | ADMIN |
| `auditor` | `audit123` | AUDITOR |
| `alice` | `alice123` | CUSTOMER |
| `bob` | `bob123` | CUSTOMER |

---

## Hướng dẫn Test

### 1. RBAC — Role-Based Access Control

**Mục đích:** Kiểm tra hệ thống phân quyền theo role, đảm bảo mỗi role chỉ truy cập được đúng chức năng.

#### Case 1.1 — CUSTOMER truy cập Admin Panel
| | |
|---|---|
| **Thao tác** | Login `alice/alice123` → vào `http://localhost:8080/admin` |
| **Input** | URL `/admin` trực tiếp trên browser |
| **Output mong đợi** | Trang **403 Forbidden** |
| **Ý nghĩa** | CUSTOMER không có quyền xem danh sách user — RBAC hoạt động đúng |

#### Case 1.2 — CUSTOMER truy cập Audit Logs
| | |
|---|---|
| **Thao tác** | Login `alice/alice123` → vào `http://localhost:8080/audit` |
| **Input** | URL `/audit` trực tiếp |
| **Output mong đợi** | Trang **403 Forbidden** |
| **Ý nghĩa** | Audit logs chỉ dành cho ADMIN và AUDITOR |

#### Case 1.3 — AUDITOR truy cập Transfer
| | |
|---|---|
| **Thao tác** | Login `auditor/audit123` → vào `http://localhost:8080/transfer` |
| **Input** | URL `/transfer` trực tiếp |
| **Output mong đợi** | Trang **403 Forbidden** |
| **Ý nghĩa** | AUDITOR chỉ có quyền đọc, không thao tác tài chính |

#### Case 1.4 — ADMIN truy cập đúng chức năng
| | |
|---|---|
| **Thao tác** | Login `admin/admin123` → vào `/admin` |
| **Output mong đợi** | Hiển thị danh sách toàn bộ users |
| **Ý nghĩa** | ADMIN có đủ quyền truy cập Admin Panel |

---

### 2. SQL Injection

Truy cập: `http://localhost:8080/vulnerable`

> **Lưu ý:** Form Vulnerable Login so sánh plain text với BCrypt hash nên không dùng để test login thường. Mục đích duy nhất là demo SQL Injection bypass.

#### Case 2.1 — Bypass authentication (Vulnerable Login)
| | |
|---|---|
| **Thao tác** | Nhập vào ô Username: `admin'#` — Password: `anything` |
| **Query thực thi** | `SELECT * FROM users WHERE username='admin'#' AND password_hash='anything'` |
| **Output mong đợi** | Trả về thông tin user `admin` dù không biết password |
| **Ý nghĩa** | `#` comment out điều kiện password → bypass authentication hoàn toàn |

#### Case 2.2 — Lấy toàn bộ users (Vulnerable Login)
| | |
|---|---|
| **Thao tác** | Username: `' OR '1'='1'#` — Password: `anything` |
| **Query thực thi** | `SELECT * FROM users WHERE username='' OR '1'='1'#...` |
| **Output mong đợi** | Trả về tất cả users trong database |
| **Ý nghĩa** | `OR '1'='1'` luôn đúng → trả về toàn bộ bảng |

#### Case 2.3 — Leak tên bảng qua UNION (Vulnerable Search)
| | |
|---|---|
| **Thao tác** | Nhập vào ô tìm kiếm: `' UNION SELECT 1,table_name,3 FROM information_schema.tables#` |
| **Query thực thi** | `SELECT id,username,role FROM users WHERE username LIKE '%' UNION SELECT 1,table_name,3 FROM information_schema.tables#'%'` |
| **Output mong đợi** | Danh sách tên tất cả bảng trong database |
| **Ý nghĩa** | UNION injection cho phép attacker truy vấn bảng ngoài phạm vi — nguy hiểm nhất |

#### Case 2.4 — Cùng payload trên Secure Search
| | |
|---|---|
| **Thao tác** | Nhập cùng payload Case 2.3 vào ô **Secure Search** |
| **Output mong đợi** | Không có kết quả |
| **Ý nghĩa** | Sequelize ORM tự động escape input → payload trở thành chuỗi literal, không thực thi được |

---

### 3. Least-Privilege Principle

**Yêu cầu:** Đã chạy `database/privileges.sql` và tạo đủ 4 MySQL users.

#### Case 3.1 — Full privilege (app_vulnerable)

Mở `src/config/db-raw.js`, đảm bảo đang dùng:

```js
user: process.env.DB_VULN_USER,
password: process.env.DB_VULN_PASS,
```

| | |
|---|---|
| **Thao tác** | Vào Vulnerable Search → nhập `' UNION SELECT 1,table_name,3 FROM information_schema.tables#` |
| **Output mong đợi** | Leak tên tất cả bảng |
| **Ý nghĩa** | User full-privilege không giới hạn thiệt hại khi bị tấn công |

#### Case 3.2 — Least privilege (app_customer)

Đổi `src/config/db-raw.js`:

```js
user: process.env.DB_CUSTOMER_USER,
password: process.env.DB_CUSTOMER_PASS,
```

| | |
|---|---|
| **Thao tác** | Vào Vulnerable Search → nhập **cùng payload** |
| **Output mong đợi** | `SQL Error: SELECT command denied to user 'app_customer'@'localhost' for table 'tables'` |
| **Ý nghĩa** | Dù SQL Injection xảy ra, MySQL từ chối vì `app_customer` không có quyền đọc `information_schema` |

> Sau khi test xong, đổi lại `db-raw.js` về `DB_VULN_USER`.

#### Bảng so sánh

| DB User | Payload | Kết quả |
|---|---|---|
| `app_vulnerable` (full) | UNION SELECT information_schema | Leak thành công |
| `app_customer` (least-privilege) | UNION SELECT information_schema | Access denied |
| Secure query (bất kỳ user) | UNION SELECT information_schema | Không có tác dụng |

---

### 4. Audit Logging

| | |
|---|---|
| **Thao tác** | Login sai password nhiều lần → Login đúng → Thực hiện transfer → Login `auditor/audit123` → vào `/audit` |
| **Output mong đợi** | Thấy các log: `LOGIN_FAIL`, `LOGIN_SUCCESS`, `TRANSFER` với đầy đủ username, IP, thời gian |
| **Ý nghĩa** | Mọi hoạt động nhạy cảm đều được ghi lại, phục vụ điều tra sau sự cố |

---



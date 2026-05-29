# Mini Online Banking — Database Security Demo

## Mục đích

Hệ thống ngân hàng thu nhỏ được xây dựng để **minh họa và kiểm thử các cơ chế bảo mật cơ sở dữ liệu**:

- SQL Injection — tấn công và phòng chống (5 kỹ thuật)
- Role-Based Access Control (RBAC)
- Least-Privilege Database Access
- BCrypt password hashing
- Account Lockout & Rate Limiting
- CSRF Protection
- Audit Logging

> Môi trường demo — không dùng cho production.

---

## Tech Stack

| Thành phần | Công nghệ |
|---|---|
| Backend | Node.js + Express 5 |
| ORM (secure queries) | Sequelize 6 |
| Raw query (vulnerable demo) | mysql2 |
| Database | MySQL 8.x |
| Password hashing | bcryptjs |
| Authentication | JWT + HttpOnly cookie |
| Security headers | helmet |
| CSRF protection | csrf-csrf |
| Rate limiting | express-rate-limit |
| Template engine | EJS |

---

## Cấu trúc project

```
src/
  app.js
  seed.js
  config/
    db.js           ← Sequelize (main connection)
    db-raw.js       ← mysql2 (vulnerable demo)
  model/
    user.model.js
    account.model.js
    transaction.model.js
    audit.model.js
  controller/
  route/
  middleware/
    auth.middleware.js      ← JWT verify
    rbac.middleware.js      ← Role checking
    csrf.middleware.js      ← CSRF protection
    rate-limit.middleware.js ← Login rate limit
  view/
database/
  privileges.sql            ← MySQL least-privilege setup
  verify-privileges.sql
```

---

## Cài đặt và chạy

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
Mở MySQL Workbench, chạy:
```sql
CREATE DATABASE IF NOT EXISTS banking;
```

### Bước 3 — Cấu hình `.env`
```env
PORT=8080
DB_HOST=localhost
DB_PORT=3306
DB_NAME=banking
DB_USER=root
DB_PASS=your_mysql_password
JWT_SECRET=your_secret_key
CSRF_SECRET=your_csrf_secret
DEMO_MODE=true

DB_CUSTOMER_USER=app_customer
DB_CUSTOMER_PASS=cust_pass123
DB_AUDITOR_USER=app_auditor
DB_AUDITOR_PASS=audit_pass123
DB_ADMIN_USER=app_admin
DB_ADMIN_PASS=admin_pass123
DB_VULN_USER=app_vulnerable
DB_VULN_PASS=vuln_pass123
```

### Bước 4 — Setup MySQL least-privilege users
Mở MySQL Workbench → mở `database/privileges.sql` → Execute.

Kiểm tra:
```sql
SELECT user, host FROM mysql.user WHERE user LIKE 'app_%';
```

### Bước 5 — Seed dữ liệu
```bash
npm run seed
```

### Bước 6 — Chạy server
```bash
npm run dev
```
Truy cập: `http://localhost:8080`

### Tài khoản test

| Username | Password | Role | Account ID |
|---|---|---|---|
| `admin` | `admin123` | ADMIN | — |
| `auditor` | `audit123` | AUDITOR | — |
| `alice` | `alice123` | CUSTOMER | In ra khi seed |
| `bob` | `bob123` | CUSTOMER | In ra khi seed |

> Account ID của alice và bob được in ra terminal sau khi chạy `npm run seed`. Ghi lại để dùng khi test transfer.

---

## Hướng dẫn Test

---

### 1. RBAC — Role-Based Access Control

**Mục đích:** Kiểm tra phân quyền theo role, đảm bảo mỗi role chỉ truy cập đúng chức năng.

> Đăng xuất trước mỗi case tại `http://localhost:8080/logout`

#### Case 1.1 — CUSTOMER truy cập Admin Panel
| | |
|---|---|
| **Chuẩn bị** | Login `alice / alice123` |
| **Thao tác** | Vào `http://localhost:8080/admin` |
| **Output mong đợi** | Trang **403 Forbidden** |
| **Ý nghĩa** | CUSTOMER không có quyền quản lý user |

#### Case 1.2 — CUSTOMER truy cập Audit Logs
| | |
|---|---|
| **Chuẩn bị** | Login `alice / alice123` |
| **Thao tác** | Vào `http://localhost:8080/audit` |
| **Output mong đợi** | Trang **403 Forbidden** |
| **Ý nghĩa** | Audit logs chỉ dành cho ADMIN và AUDITOR |

#### Case 1.3 — AUDITOR truy cập Transfer
| | |
|---|---|
| **Chuẩn bị** | Login `auditor / audit123` |
| **Thao tác** | Vào `http://localhost:8080/transfer` |
| **Output mong đợi** | Trang **403 Forbidden** |
| **Ý nghĩa** | AUDITOR chỉ đọc, không thao tác tài chính |

#### Case 1.4 — ADMIN truy cập Admin Panel
| | |
|---|---|
| **Chuẩn bị** | Login `admin / admin123` |
| **Thao tác** | Vào `http://localhost:8080/admin` |
| **Output mong đợi** | Danh sách toàn bộ users |
| **Ý nghĩa** | ADMIN có đủ quyền — RBAC cho phép đúng |

#### Case 1.5 — AUDITOR truy cập Audit Logs
| | |
|---|---|
| **Chuẩn bị** | Login `auditor / audit123` |
| **Thao tác** | Vào `http://localhost:8080/audit` |
| **Output mong đợi** | Danh sách audit logs |
| **Ý nghĩa** | AUDITOR có quyền read-only trên logs |

---

### 2. Account Lockout & Rate Limiting

**Mục đích:** Ngăn brute-force tấn công mật khẩu.

#### Case 2.1 — Account Lockout sau 5 lần sai
| | |
|---|---|
| **Thao tác** | Vào `/login` → nhập `alice` + sai password **5 lần liên tiếp** |
| **Output mong đợi** | Lần 1–4: thông báo còn N lần thử. Lần 5: tài khoản bị khóa 5 phút |
| **Ý nghĩa** | Sau `MAX_FAILED_ATTEMPTS=5`, account bị lock tạm thời — brute-force không hiệu quả |

#### Case 2.2 — Tự động mở khóa sau 5 phút
| | |
|---|---|
| **Thao tác** | Chờ 5 phút → login lại với đúng password `alice123` |
| **Output mong đợi** | Đăng nhập thành công |
| **Ý nghĩa** | Khóa tạm thời, không phải vĩnh viễn |

#### Case 2.3 — Rate Limiting (10 request/10 phút)
| | |
|---|---|
| **Thao tác** | Dùng Postman gửi `POST /login` với wrong password **hơn 10 lần** trong 10 phút |
| **Output mong đợi** | HTTP **429 Too Many Requests** — thông báo thử lại sau 10 phút |
| **Ý nghĩa** | Rate limit chặn automated brute-force ngay cả khi đổi password liên tục |

---

### 3. SQL Injection Demo

Truy cập: `http://localhost:8080/vulnerable`

> **Lưu ý:** Vulnerable Login dùng plain-text so với BCrypt hash, nên payload tấn công mới có tác dụng — không phải để login thường.

---

#### Nhóm A — Authentication Bypass (Vulnerable Login)

#### Case 3.1 — Bypass bằng comment (#)
| | |
|---|---|
| **Form** | Vulnerable Login |
| **Username** | `admin'#` |
| **Password** | `anything` |
| **Query thực thi** | `SELECT * FROM users WHERE username='admin'#' AND password_hash='anything'` |
| **Output mong đợi** | Trả về thông tin user `admin` |
| **Ý nghĩa** | `#` comment out toàn bộ điều kiện password → bypass hoàn toàn |

#### Case 3.2 — OR injection lấy tất cả users
| | |
|---|---|
| **Form** | Vulnerable Login |
| **Username** | `' OR '1'='1'#` |
| **Password** | `anything` |
| **Query thực thi** | `SELECT * FROM users WHERE username='' OR '1'='1'#' AND password_hash='anything'` |
| **Output mong đợi** | Trả về toàn bộ users trong database |
| **Ý nghĩa** | `'1'='1'` luôn đúng → WHERE condition luôn true |

#### Case 3.3 — Secure Login với cùng payload
| | |
|---|---|
| **Form** | Secure Login |
| **Username** | `admin'#` hoặc `' OR '1'='1'#` |
| **Password** | `anything` |
| **Output mong đợi** | Không tìm thấy — đăng nhập thất bại |
| **Ý nghĩa** | Sequelize tách query và value → payload là string literal, không thực thi |

---

#### Nhóm B — UNION Injection (Vulnerable Search — LIKE)

#### Case 3.4 — Leak tên tất cả bảng
| | |
|---|---|
| **Form** | Vulnerable Search |
| **Input** | `' UNION SELECT 1,table_name,3 FROM information_schema.tables#` |
| **Query thực thi** | `SELECT id,username,role FROM users WHERE username LIKE '%' UNION SELECT 1,table_name,3 FROM information_schema.tables#'%'` |
| **Output mong đợi** | Danh sách tên tất cả bảng (users, accounts, transactions...) |
| **Ý nghĩa** | Attacker dò được cấu trúc database |

#### Case 3.5 — Leak password hash
| | |
|---|---|
| **Form** | Vulnerable Search |
| **Input** | `' UNION SELECT 1,password_hash,3 FROM users#` |
| **Query thực thi** | `SELECT id,username,role FROM users WHERE username LIKE '%' UNION SELECT 1,password_hash,3 FROM users#'%'` |
| **Output mong đợi** | Các chuỗi BCrypt hash của tất cả users |
| **Ý nghĩa** | Attacker có thể đem hash đi crack offline (rainbow table, hashcat) |

#### Case 3.6 — Leak tên cột bảng users
| | |
|---|---|
| **Form** | Vulnerable Search |
| **Input** | `' UNION SELECT 1,column_name,3 FROM information_schema.columns WHERE table_name='users'#` |
| **Output mong đợi** | Tên các cột: id, username, password_hash, role, failed_login_attempts... |
| **Ý nghĩa** | Attacker biết chính xác cấu trúc bảng để khai thác tiếp |

#### Case 3.7 — Secure Search với cùng payload
| | |
|---|---|
| **Form** | Secure Search |
| **Input** | Bất kỳ payload nào ở trên |
| **Output mong đợi** | Không có kết quả |
| **Ý nghĩa** | Sequelize `Op.like` escape input → payload là literal string |

---

#### Nhóm C — UNION Injection (Vulnerable Search by ID)

#### Case 3.8 — Leak password hash qua ID search
| | |
|---|---|
| **Form** | Vulnerable Search by ID |
| **Input** | `1 UNION SELECT 1,password_hash,3 FROM users#` |
| **Query thực thi** | `SELECT id,username,role FROM users WHERE id = 1 UNION SELECT 1,password_hash,3 FROM users#` |
| **Output mong đợi** | User ID=1 + toàn bộ password hash |
| **Ý nghĩa** | Query dùng `=` (không cần dấu nháy) dễ inject hơn LIKE |

#### Case 3.9 — Lấy tất cả users qua OR
| | |
|---|---|
| **Form** | Vulnerable Search by ID |
| **Input** | `1 OR 1=1#` |
| **Query thực thi** | `SELECT id,username,role FROM users WHERE id = 1 OR 1=1#` |
| **Output mong đợi** | Toàn bộ users |
| **Ý nghĩa** | Numeric field không cần dấu nháy — injection đơn giản hơn |

#### Case 3.10 — Secure Search by ID với cùng payload
| | |
|---|---|
| **Form** | Secure Search by ID |
| **Input** | `1 UNION SELECT 1,password_hash,3 FROM users#` |
| **Output mong đợi** | Không có kết quả (hoặc chỉ trả về user ID=1 nếu tồn tại) |
| **Ý nghĩa** | Sequelize tự cast và validate kiểu dữ liệu |

---

#### Nhóm D — Time-based Blind Injection

#### Case 3.11 — Xác nhận injection tồn tại qua thời gian
| | |
|---|---|
| **Form** | Time-based Blind |
| **Input** | `alice' AND SLEEP(3)#` |
| **Query thực thi** | `SELECT id FROM users WHERE username = 'alice' AND SLEEP(3)#'` |
| **Output mong đợi** | Phản hồi sau ~3 giây — trang hiện `⏱ ~3000ms — SLEEP() đã thực thi!` |
| **Ý nghĩa** | Dù không thấy data, attacker biết injection hoạt động qua thời gian chờ |

#### Case 3.12 — Boolean-based: xác nhận user tồn tại
| | |
|---|---|
| **Form** | Time-based Blind |
| **Input lần 1** | `alice' AND 1=1#` → phản hồi nhanh, có kết quả |
| **Input lần 2** | `alice' AND 1=2#` → phản hồi nhanh, không có kết quả |
| **Ý nghĩa** | So sánh 2 response → attacker suy ra `alice` là username hợp lệ dù không thấy data trực tiếp |

---

### 4. Least-Privilege Principle

**Yêu cầu:** Đã chạy `database/privileges.sql`.

#### Case 4.1 — Full privilege (app_vulnerable)

Đảm bảo `src/config/db-raw.js` đang dùng:
```js
user: process.env.DB_VULN_USER,
password: process.env.DB_VULN_PASS,
```

| | |
|---|---|
| **Thao tác** | Vulnerable Search → `' UNION SELECT 1,table_name,3 FROM information_schema.tables#` |
| **Output mong đợi** | Leak tên tất cả bảng |
| **Ý nghĩa** | Full-privilege: SQL Injection gây thiệt hại tối đa |

#### Case 4.2 — Least privilege (app_customer)

Đổi `src/config/db-raw.js`:
```js
user: process.env.DB_CUSTOMER_USER,
password: process.env.DB_CUSTOMER_PASS,
```

| | |
|---|---|
| **Thao tác** | Vulnerable Search → cùng payload trên |
| **Output mong đợi** | `SQL Error: SELECT command denied to user 'app_customer'@'localhost' for table 'tables'` |
| **Ý nghĩa** | Dù injection xảy ra, MySQL từ chối vì `app_customer` không có quyền đọc `information_schema` |

> Đổi lại `db-raw.js` về `DB_VULN_USER` sau khi test xong.

#### Bảng so sánh

| DB User | Quyền | Cùng payload | Kết quả |
|---|---|---|---|
| `app_vulnerable` | ALL PRIVILEGES | UNION SELECT information_schema | Leak thành công |
| `app_customer` | SELECT trên accounts, transactions | UNION SELECT information_schema | Access denied |
| Secure query | Bất kỳ | Bất kỳ | Không có tác dụng |

---

### 5. Audit Logging

**Mục đích:** Mọi hoạt động nhạy cảm đều được ghi lại để điều tra sau sự cố.

#### Case 5.1 — Xem đầy đủ các loại event

| | |
|---|---|
| **Thao tác** | Thực hiện theo thứ tự: (1) Login sai 3 lần → (2) Login đúng → (3) Transfer tiền → (4) Vào `/admin` bằng tài khoản CUSTOMER → (5) Login `auditor/audit123` → vào `/audit` |
| **Output mong đợi** | Thấy các event: `LOGIN_FAIL`, `LOGIN_SUCCESS`, `TRANSFER`, `UNAUTHORIZED_ACCESS` |
| **Ý nghĩa** | Mọi hành vi bất thường đều bị ghi lại kèm IP và timestamp |

#### Case 5.2 — SQL Injection attempt được ghi lại

| | |
|---|---|
| **Thao tác** | Nhập payload `admin'#` vào Vulnerable Login → Login `auditor/audit123` → vào `/audit` |
| **Output mong đợi** | Thấy event `SQL_INJECTION_ATTEMPT` với IP và payload |
| **Ý nghĩa** | Hệ thống phát hiện và ghi lại các pattern injection ngay cả trên endpoint vulnerable |

---

## Thành viên

| Tên | MSSV | Phụ trách |
|---|---|---|
| Nguyễn Vũ Phương Trang | 2131220008 | Authentication, RBAC, Account Lockout |
| Trương Thị Vân | 2331220034 | SQL Injection demo, Secure query, CSRF |
| Ngô Xuân Vĩnh | 2031220009 | DB setup, Least-privilege, Audit Logging |

**Giảng viên hướng dẫn:** Msc. Nguyen Ngoc Thanh

import mysql from 'mysql2';
import dotenv from 'dotenv';
dotenv.config();

const connection = mysql.createConnection({
    host:     process.env.DB_HOST,
    port:     process.env.DB_PORT,
    
    // chỗ này để test cái least-privilege nè, 
    // muốn truy cập db bằng user nào thì đổi ở 2 dòng này
    // Tên biến mỗi loại User ở trong file .env
    user:     process.env.DB_CUSTOMER_USER,
    password: process.env.DB_CUSTOMER_PASS,


    database: process.env.DB_NAME,
});

export default connection;

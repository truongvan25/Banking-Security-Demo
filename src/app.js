import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import sequelize from './config/db.js';
import './model/user.model.js';
import './model/account.model.js';
import './model/transaction.model.js';
import './model/audit.model.js';
import authRoute from './route/auth.route.js';
import dashboardRoute from './route/dashboard.route.js';
import adminRoute   from './route/admin.route.js';
import auditorRoute from './route/auditor.route.js';
import vulnerableRoute from './route/vulnerable.route.js';
import transferRoute from './route/transfer.route.js';


dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set('view engine', 'ejs');
app.set('views', './src/view');

app.get('/', (req, res) => res.render('home'));
app.use('/', authRoute);
app.use('/', dashboardRoute);
app.use('/', adminRoute);
app.use('/', auditorRoute);
app.use('/', vulnerableRoute);
app.use('/', transferRoute);

const PORT = process.env.PORT || 3000;
sequelize.sync({ alter: true })
    .then(() => {
        console.log('Database synced');
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(err => console.error('DB connection failed:', err));

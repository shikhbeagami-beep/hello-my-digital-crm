const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const { initDatabase } = require('./models/database');

// Initialize database
initDatabase();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
  secret: 'digital-crm-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const clientRoutes = require('./routes/client');

app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/client', clientRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Digital Marketing CRM is running on http://localhost:${PORT}`);
  console.log('Default admin credentials: username=admin, password=admin123');
});

module.exports = app;

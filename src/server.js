// src/server.js or src/app.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
// Import routes
const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');
const dashboardRoutes = require('./routes/dashboard');
const app = express();
const expressLayouts = require('express-ejs-layouts');
//app.set('layout', 'layout'); 
app.use(methodOverride('_method'));
// Middleware
app.use(cors());
app.use(expressLayouts);
app.set('layout', 'layout');
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));;
app.use(express.static(path.join(__dirname, '../public')));
app.use(cookieParser()); 
// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
// Routes
app.get('/', (req, res) => {
  if (req.cookies.token) {
    // User is logged in, redirect to dashboard
    res.redirect('/dashboard');
  } else {
    // User is not logged in, show the home page with login/register options
    res.render('index', { title: 'Welcome to Knowledge Base' });
  }
});

app.use('/auth', authRoutes);
app.use('/documents', documentRoutes);
app.use('/dashboard', dashboardRoutes);
// Catch-all route for any unmatched routes
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found' });
});

// Database connection
mongoose.connect(config.mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
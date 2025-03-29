// src/middleware/auth.js

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');

const auth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      throw new Error('No token provided');
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await User.findOne({ _id: decoded.userId });

    if (!user) {
      throw new Error('User not found');
    }

    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    res.status(401).json({ error: 'Please authenticate.' });
  }
};

// Optional: Admin authentication middleware
const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {});
    if (req.user.role !== 'admin') {
      throw new Error();
    }
    next();
  } catch (error) {
    res.status(403).send({ error: 'Access denied. Admin rights required.' });
  }
};

module.exports = { auth, adminAuth };
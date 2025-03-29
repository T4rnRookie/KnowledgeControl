const jwt = require('jsonwebtoken');
const config = require('../config');

const authCheck = (req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    try {
      jwt.verify(token, config.jwtSecret);
      // If token is valid, redirect to dashboard
      return res.redirect('/dashboard');
    } catch (error) {
      // If token is invalid, clear it and continue
      res.clearCookie('token');
    }
  }
  next();
};

module.exports = { authCheck };
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { User, Client } = require('../models');

// Login page
router.get('/login', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/dashboard');
  }
  res.render('login', { error: null });
});

// Login POST
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const user = User.findByUsername(username);
    
    if (!user) {
      return res.render('login', { error: 'Invalid username or password' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.render('login', { error: 'Invalid username or password' });
    }
    
    req.session.userId = user.id;
    req.session.userRole = user.role;
    req.session.userName = user.name;
    
    // Redirect based on role
    if (user.role === 'client') {
      return res.redirect('/client/dashboard');
    } else {
      return res.redirect('/admin/dashboard');
    }
  } catch (error) {
    console.error('Login error:', error);
    res.render('login', { error: 'An error occurred during login' });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// Home redirect
router.get('/', (req, res) => {
  if (req.session.userId) {
    if (req.session.userRole === 'client') {
      return res.redirect('/client/dashboard');
    } else {
      return res.redirect('/admin/dashboard');
    }
  }
  res.redirect('/login');
});

module.exports = router;

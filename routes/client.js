const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const { Client, DailySpend, Project, TopupRequest } = require('../models');

// Client Dashboard
router.get('/dashboard', requireAuth, requireRole('client'), (req, res) => {
  try {
    const client = Client.findByUserId(req.session.userId);
    
    if (!client) {
      return res.status(404).send('Client profile not found');
    }
    
    // Get recent daily spends
    const recentSpends = DailySpend.getByClientId(client.id, 10);
    const spendStats = DailySpend.getTotalSpendByClient(client.id);
    
    // Get client projects
    const projects = Project.getByClientId(client.id);
    
    // Get topup requests
    const topupRequests = TopupRequest.getByClientId(client.id);
    
    res.render('client/dashboard', {
      user: { name: req.session.userName, role: req.session.userRole },
      client,
      recentSpends,
      spendStats,
      projects,
      topupRequests
    });
  } catch (error) {
    console.error('Client dashboard error:', error);
    res.status(500).send('Error loading dashboard');
  }
});

// View Profile
router.get('/profile', requireAuth, requireRole('client'), (req, res) => {
  try {
    const client = Client.findByUserId(req.session.userId);
    
    if (!client) {
      return res.status(404).send('Client profile not found');
    }
    
    res.render('client/profile', {
      user: { name: req.session.userName, role: req.session.userRole },
      client
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).send('Error loading profile');
  }
});

// Request Topup
router.post('/topup/request', requireAuth, requireRole('client'), (req, res) => {
  try {
    const { amount } = req.body;
    const client = Client.findByUserId(req.session.userId);
    
    if (!client) {
      return res.status(404).send('Client profile not found');
    }
    
    TopupRequest.create(client.id, parseFloat(amount));
    
    res.redirect('/client/dashboard');
  } catch (error) {
    console.error('Topup request error:', error);
    res.status(500).send('Error submitting topup request');
  }
});

// View Spending History
router.get('/spending', requireAuth, requireRole('client'), (req, res) => {
  try {
    const client = Client.findByUserId(req.session.userId);
    
    if (!client) {
      return res.status(404).send('Client profile not found');
    }
    
    const dailySpends = DailySpend.getByClientId(client.id, 60);
    const spendStats = DailySpend.getTotalSpendByClient(client.id);
    
    res.render('client/spending', {
      user: { name: req.session.userName, role: req.session.userRole },
      client,
      dailySpends,
      spendStats
    });
  } catch (error) {
    console.error('Spending history error:', error);
    res.status(500).send('Error loading spending history');
  }
});

module.exports = router;

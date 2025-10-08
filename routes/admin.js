const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const { User, Client, TopupRequest, DailySpend, Project } = require('../models');

// Admin Dashboard
router.get('/dashboard', requireAuth, requireRole('admin', 'employee'), (req, res) => {
  try {
    const clients = Client.getAll();
    const totalClients = clients.length;
    
    // Calculate total spend
    let totalSpend = 0;
    clients.forEach(client => {
      const spendData = DailySpend.getTotalSpendByClient(client.id);
      totalSpend += spendData.total_spend || 0;
    });
    
    // Get pending topup requests
    const pendingTopups = TopupRequest.getAll('pending');
    
    // Get running projects
    const runningProjects = Project.getAll('in_progress');
    
    res.render('admin/dashboard', {
      user: { name: req.session.userName, role: req.session.userRole },
      totalClients,
      totalSpend: totalSpend.toFixed(2),
      clients,
      pendingTopups,
      runningProjects: runningProjects.slice(0, 5)
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).send('Error loading dashboard');
  }
});

// Client Management
router.get('/clients', requireAuth, requireRole('admin', 'employee'), (req, res) => {
  try {
    const clients = Client.getAll();
    res.render('admin/clients', {
      user: { name: req.session.userName, role: req.session.userRole },
      clients
    });
  } catch (error) {
    console.error('Clients error:', error);
    res.status(500).send('Error loading clients');
  }
});

// Add Client
router.get('/clients/add', requireAuth, requireRole('admin', 'employee'), (req, res) => {
  res.render('admin/client-form', {
    user: { name: req.session.userName, role: req.session.userRole },
    client: null,
    error: null
  });
});

router.post('/clients/add', requireAuth, requireRole('admin', 'employee'), async (req, res) => {
  try {
    const { name, username, email, phone, facebook_link, whatsapp_number, initial_balance } = req.body;
    
    // Create user
    const hashedPassword = await bcrypt.hash('client123', 10);
    const userId = User.create(username, hashedPassword, 'client', name, email, phone);
    
    // Create client profile
    const clientId = Client.create(userId, facebook_link, whatsapp_number);
    
    // Set initial balance if provided
    if (initial_balance && parseFloat(initial_balance) > 0) {
      Client.updateBalance(clientId, parseFloat(initial_balance));
    }
    
    res.redirect('/admin/clients');
  } catch (error) {
    console.error('Add client error:', error);
    res.render('admin/client-form', {
      user: { name: req.session.userName, role: req.session.userRole },
      client: null,
      error: 'Error adding client: ' + error.message
    });
  }
});

// View Client Details
router.get('/clients/:id', requireAuth, requireRole('admin', 'employee'), (req, res) => {
  try {
    const client = Client.findById(req.params.id);
    if (!client) {
      return res.status(404).send('Client not found');
    }
    
    const dailySpends = DailySpend.getByClientId(client.id);
    const spendStats = DailySpend.getTotalSpendByClient(client.id);
    const projects = Project.getByClientId(client.id);
    const topupRequests = TopupRequest.getByClientId(client.id);
    
    res.render('admin/client-details', {
      user: { name: req.session.userName, role: req.session.userRole },
      client,
      dailySpends,
      spendStats,
      projects,
      topupRequests
    });
  } catch (error) {
    console.error('Client details error:', error);
    res.status(500).send('Error loading client details');
  }
});

// Submit Daily Spend
router.post('/clients/:id/daily-spend', requireAuth, requireRole('admin', 'employee'), (req, res) => {
  try {
    const { spend_date, amount, sales_count, notes } = req.body;
    const clientId = parseInt(req.params.id);
    
    DailySpend.create(clientId, spend_date, parseFloat(amount), parseInt(sales_count) || 0, notes);
    
    // Deduct from client balance
    Client.updateBalance(clientId, -parseFloat(amount));
    
    res.redirect(`/admin/clients/${clientId}`);
  } catch (error) {
    console.error('Daily spend error:', error);
    res.status(500).send('Error submitting daily spend');
  }
});

// WhatsApp Message (generates pre-filled link)
router.get('/clients/:id/whatsapp', requireAuth, requireRole('admin', 'employee'), (req, res) => {
  try {
    const client = Client.findById(req.params.id);
    if (!client || !client.whatsapp_number) {
      return res.status(404).send('Client or WhatsApp number not found');
    }
    
    // Generate WhatsApp link with pre-filled message
    const message = encodeURIComponent(`Hello ${client.name}, this is a message from Digital Marketing CRM.`);
    const whatsappUrl = `https://wa.me/${client.whatsapp_number.replace(/\D/g, '')}?text=${message}`;
    
    res.redirect(whatsappUrl);
  } catch (error) {
    console.error('WhatsApp error:', error);
    res.status(500).send('Error generating WhatsApp link');
  }
});

// Projects Management
router.get('/projects', requireAuth, requireRole('admin', 'employee'), (req, res) => {
  try {
    const projects = Project.getAll();
    const clients = Client.getAll();
    const employees = User.getAll('employee');
    
    res.render('admin/projects', {
      user: { name: req.session.userName, role: req.session.userRole },
      projects,
      clients,
      employees
    });
  } catch (error) {
    console.error('Projects error:', error);
    res.status(500).send('Error loading projects');
  }
});

// Add Project
router.post('/projects/add', requireAuth, requireRole('admin', 'employee'), (req, res) => {
  try {
    const { client_id, project_type, project_name, website_url, username, password, assigned_to, notes } = req.body;
    
    Project.create(
      parseInt(client_id),
      project_type,
      project_name,
      website_url,
      username,
      password,
      assigned_to ? parseInt(assigned_to) : null,
      notes
    );
    
    res.redirect('/admin/projects');
  } catch (error) {
    console.error('Add project error:', error);
    res.status(500).send('Error adding project');
  }
});

// Update Project
router.post('/projects/:id/update', requireAuth, requireRole('admin', 'employee'), (req, res) => {
  try {
    const { status, assigned_to, notes } = req.body;
    
    const updateData = {};
    if (status) updateData.status = status;
    if (assigned_to) updateData.assigned_to = parseInt(assigned_to);
    if (notes !== undefined) updateData.notes = notes;
    
    Project.update(parseInt(req.params.id), updateData);
    
    res.redirect('/admin/projects');
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).send('Error updating project');
  }
});

// Topup Requests Management
router.get('/topups', requireAuth, requireRole('admin', 'employee'), (req, res) => {
  try {
    const topupRequests = TopupRequest.getAll();
    
    res.render('admin/topups', {
      user: { name: req.session.userName, role: req.session.userRole },
      topupRequests
    });
  } catch (error) {
    console.error('Topups error:', error);
    res.status(500).send('Error loading topup requests');
  }
});

// Process Topup Request
router.post('/topups/:id/process', requireAuth, requireRole('admin', 'employee'), (req, res) => {
  try {
    const { action } = req.body;
    const topupId = parseInt(req.params.id);
    
    // Get the topup request
    const topups = TopupRequest.getAll();
    const topup = topups.find(t => t.id === topupId);
    
    if (!topup) {
      return res.status(404).send('Topup request not found');
    }
    
    if (action === 'approve') {
      // Update topup status
      TopupRequest.updateStatus(topupId, 'approved', req.session.userId);
      // Add balance to client
      Client.updateBalance(topup.client_id, topup.amount);
    } else if (action === 'reject') {
      TopupRequest.updateStatus(topupId, 'rejected', req.session.userId);
    }
    
    res.redirect('/admin/topups');
  } catch (error) {
    console.error('Process topup error:', error);
    res.status(500).send('Error processing topup request');
  }
});

module.exports = router;

const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.session.userId || !roles.includes(req.session.userRole)) {
      return res.status(403).send('Access denied');
    }
    next();
  };
};

module.exports = { requireAuth, requireRole };

// middleware/adminAuth.js
module.exports = function (req, res, next) {
  const adminKey = req.headers['x-admin-key'];
  // If ADMIN_KEY is configured, require it
  if (process.env.ADMIN_KEY) {
    if (adminKey === process.env.ADMIN_KEY) return next();
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Development convenience: allow when NODE_ENV=development and ADMIN_KEY not set
  if (process.env.NODE_ENV !== 'production'){
    console.warn('[adminAuth] WARNING: ADMIN_KEY not set, allowing admin action in non-production environment');
    return next();
  }

  // Otherwise deny
  res.status(401).json({ message: 'Unauthorized' });
};

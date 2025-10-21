// middleware/adminAuth.js
module.exports = function (req, res, next) {
  const adminKey = req.headers['x-admin-key'];
  if (adminKey === process.env.ADMIN_KEY) return next();
  res.status(401).json({ message: 'Unauthorized' });
};

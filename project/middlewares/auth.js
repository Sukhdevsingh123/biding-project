// middlewares/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
  const token = req.header('Authorization').replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) {
      throw new Error();
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(401).send({ error: 'Please authenticate.' });
  }
};

const authorize = (roles) => (req, res, next) => {
  if (roles.includes(req.user.role)) {
    return next();
  }
  res.status(403).send({ error: 'Forbidden' });
};

module.exports = { authenticate, authorize };

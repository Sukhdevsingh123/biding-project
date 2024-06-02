// routes/notifications.js
const express = require('express');
const { Notification } = require('../models');
const { authenticate } = require('../middlewares/auth');
const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  const notifications = await Notification.findAll({ where: { userId: req.user.id, isRead: false } });
  res.send(notifications);
});

router.post('/mark-read', authenticate, async (req, res) => {
  await Notification.update({ isRead: true }, { where: { userId: req.user.id } });
  res.send({ message: 'Notifications marked as read' });
});

module.exports = router;

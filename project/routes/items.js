// routes/items.js
const express = require('express');
const { Item, Bid, User } = require('../models');
const { authenticate, authorize } = require('../middlewares/auth');
const multer = require('multer');
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

router.get('/', async (req, res) => {
  const items = await Item.findAll();
  res.render('index', { title: 'Auction Items', items, user: req.user });
});

router.get('/:id', async (req, res) => {
  const item = await Item.findByPk(req.params.id, {
    include: [{ model: Bid, include: [User] }]
  });
  if (!item) {
    return res.status(404).send({ error: 'Item not found' });
  }
  const bids = await Bid.findAll({ where: { itemId: req.params.id }, include: [User] });
  res.render('item', { title: item.name, item, bids, user: req.user });
});

router.get('/new', authenticate, (req, res) => {
  res.render('new-item', { title: 'Create New Item', user: req.user });
});

router.post('/', authenticate, upload.single('image'), async (req, res) => {
  const { name, description, startingPrice, endTime } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const item = await Item.create({ name, description, startingPrice, currentPrice: startingPrice, endTime, imageUrl });
  res.redirect(`/items/${item.id}`);
});

router.get('/:id/edit', authenticate, async (req, res) => {
  const item = await Item.findByPk(req.params.id);
  if (!item) {
    return res.status(404).send({ error: 'Item not found' });
  }
  res.render('edit-item', { title: 'Edit Item', item, user: req.user });
});

router.put('/:id', authenticate, authorize(['admin', 'user']), upload.single('image'), async (req, res) => {
  const item = await Item.findByPk(req.params.id);
  if (!item) {
    return res.status(404).send({ error: 'Item not found' });
  }

  const { name, description, startingPrice, endTime } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : item.imageUrl;

  if (item.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).send({ error: 'Forbidden' });
  }

  await item.update({ name, description, startingPrice, endTime, imageUrl });
  res.redirect(`/items/${item.id}`);
});

router.delete('/:id', authenticate, authorize(['admin', 'user']), async (req, res) => {
  const item = await Item.findByPk(req.params.id);
  if (!item) {
    return res.status(404).send({ error: 'Item not found' });
  }

  if (item.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).send({ error: 'Forbidden' });
  }

  await item.destroy();
  res.redirect('/items');
});

module.exports = router;

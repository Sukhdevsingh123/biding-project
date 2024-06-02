// routes/bids.js
const express = require('express');
const { Bid, Item } = require('../models');
const { authenticate } = require('../middlewares/auth');
const router = express.Router();

router.get('/items/:itemId', async (req, res) => {
  const bids = await Bid.findAll({ where: { itemId: req.params.itemId } });
  res.send(bids);
});

router.post('/items/:itemId', authenticate, async (req, res) => {
  const { bidAmount } = req.body;
  const item = await Item.findByPk(req.params.itemId);

  if (!item) {
    return res.status(404).send({ error: 'Item not found' });
  }

  if (bidAmount <= item.currentPrice) {
    return res.status(400).send({ error: 'Bid amount must be higher than current price' });
  }

  item.currentPrice = bidAmount;
  await item.save();

  const bid = await Bid.create({ itemId: item.id, userId: req.user.id, bidAmount });

  res.send(bid);
});

module.exports = router;

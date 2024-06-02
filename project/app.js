// app.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const sequelize = require('./database');
const { User, Item, Bid, Notification } = require('./models');
const userRoutes = require('./routes/users');
const itemRoutes = require('./routes/items');
const bidRoutes = require('./routes/bids');
const notificationRoutes = require('./routes/notifications');
const { authenticate } = require('./middlewares/auth');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Set up EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/users', userRoutes);
app.use('/items', itemRoutes);
app.use('/bids', bidRoutes);
app.use('/notifications', notificationRoutes);

// Socket.io setup
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('bid', async (data) => {
    const { itemId, userId, bidAmount } = data;

    try {
      const item = await Item.findByPk(itemId);
      if (!item) {
        socket.emit('error', { message: 'Item not found' });
        return;
      }

      if (bidAmount <= item.currentPrice) {
        socket.emit('error', { message: 'Bid amount must be higher than current price' });
        return;
      }

      item.currentPrice = bidAmount;
      await item.save();

      const bid = await Bid.create({ itemId, userId, bidAmount });

      io.emit('newBid', { itemId, userId, bidAmount, bid });

      const user = await User.findByPk(userId);
      if (user) {
        await Notification.create({
          userId: item.userId,
          message: `New bid on your item: ${item.name} by ${user.username}`,
        });
      }
    } catch (error) {
      socket.emit('error', { message: 'Error placing bid' });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Database synchronization and server start
const PORT = process.env.PORT || 3000;

sequelize.sync({ alter: true }).then(() => {
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});

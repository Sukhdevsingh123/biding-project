// routes/users.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// const { User } = require('../models');
const {User} = require('../models/User');

const { authenticate } = require('../middlewares/auth');
const router = express.Router();

// router.get('/register', (req, res) => {
//   res.render('register', { title: 'Register', user: null });
// });
router.get('/register', (req, res) => {
  res.render('layout', {
    title: 'Register',
    user: null,
    body: `
      <h2>Register</h2>
      <form action="/users/register" method="POST">
        <label for="username">Username</label>
        <input type="text" id="username" name="username" required>
  
        <label for="email">Email</label>
        <input type="email" id="email" name="email" required>
  
        <label for="password">Password</label>
        <input type="password" id="password" name="password" required>
  
        <button type="submit">Register</button>
      </form>
    `
  });
});


router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  console.log(req.body); // Debugging statement

  if (!username || !email || !password) {
    return res.status(400).send('All fields are required');
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ username, email, password: hashedPassword });
    res.redirect('/users/login');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

router.get('/login', (req, res) => {
  res.render('login', { title: 'Login' });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });

  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.status(400).send({ error: 'Invalid login credentials' });
  }

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
  res.send({ user, token });
});

router.get('/profile', authenticate, async (req, res) => {
  res.render('profile', { title: 'Profile', user: req.user });
});

module.exports = router;

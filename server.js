const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public'));

app.use(session({
  secret: 'agroglobal_secret_key',
  resave: false,
  saveUninitialized: true,
}));

const USERS_FILE = './users.json';
const PRODUCTS_FILE = './public/products.json';

function loadUsers() {
  return JSON.parse(fs.readFileSync(USERS_FILE));
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

app.post('/api/signup', async (req, res) => {
  const { name, email, password } = req.body;
  const users = loadUsers();
  if (users.find(u => u.email === email)) {
    return res.status(400).send('Email already exists');
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ name, email, password: hashedPassword, isAdmin: email === "admin@agro.com" });
  saveUsers(users);
  res.status(201).send('User created');
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const users = loadUsers();
  const user = users.find(u => u.email === email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).send('Invalid credentials');
  }
  req.session.user = { email: user.email, isAdmin: user.isAdmin };
  res.send('Login successful');
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.get('/api/products', (req, res) => {
  const data = fs.readFileSync(PRODUCTS_FILE);
  res.json(JSON.parse(data));
});

app.post('/api/products', (req, res) => {
  if (!req.session.user || !req.session.user.isAdmin) {
    return res.status(403).send('Admin only');
  }
  const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE));
  const newProduct = { id: Date.now(), ...req.body };
  products.push(newProduct);
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
  res.status(201).send('Added');
});

// Fallback to index.html for unknown routes (SPA handling)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
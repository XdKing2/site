const express = require('express');
const fs = require('fs');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const USERS_FILE = './users.json';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'agro_secret_key', resave: false, saveUninitialized: true }));

// Serve static files
app.use(express.static('public'));

function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  const data = fs.readFileSync(USERS_FILE);
  return JSON.parse(data);
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

app.post('/signup', async (req, res) => {
  const { email, password, name } = req.body;
  const users = loadUsers();

  if (users.find(u => u.email === email)) {
    return res.status(400).send('User already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ email, name, password: hashedPassword, isAdmin: false });
  saveUsers(users);
  res.redirect('/login.html');
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const users = loadUsers();
  const user = users.find(u => u.email === email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).send('Invalid credentials');
  }

  req.session.user = { email: user.email, name: user.name, isAdmin: user.isAdmin };
  res.redirect(user.isAdmin ? '/admin.html' : '/index.html');
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/index.html');
});

app.get('/admin.html', (req, res, next) => {
  if (!req.session.user || !req.session.user.isAdmin) {
    return res.status(403).send('Access Denied');
  }
  next();
}, express.static(path.join(__dirname, 'public', 'admin.html')));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const PRODUCTS_FILE = './public/products.json';

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

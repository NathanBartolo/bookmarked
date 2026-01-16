const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
require('dotenv').config();

// Route and Config Imports
const bookshelfRoute = require('./routes/bookshelf');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin'); 
require('./config/passport'); 

const app = express();
const PORT = process.env.PORT || 3000;
const OPEN_LIBRARY_BASE_URL = 'https://openlibrary.org/search.json';

// Database Connection 
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected')) 
  .catch(err => console.error('Connection error:', err));

// Middleware Configuration 
app.use(cors({
  origin: [
    'https://bookmarked-henna.vercel.app'
  ], 
  credentials: true,  
  methods: ['GET', 'POST', 'PUT', 'DELETE'], 
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Session Management
app.use(session({
  secret: process.env.SESSION_SECRET || 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  proxy: true, 
  cookie: { 
    secure: process.env.NODE_ENV === 'production', 
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' 
  } 
}));

app.use(passport.initialize());
app.use(passport.session());

// Health Check Route
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Route Handlers
app.use('/auth', authRoutes);
app.use('/api/bookshelf', bookshelfRoute);
app.use('/api/admin', adminRoutes); 

// Search Proxy
app.get('/api/search-books', async (req, res) => {
    const queryString = new URLSearchParams(req.query).toString();
    if (!queryString) return res.status(400).json({ error: 'Query required.' });
    try {
        const response = await fetch(`${OPEN_LIBRARY_BASE_URL}?${queryString}`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

// Server Initialization
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Export for Vercel
module.exports = app;
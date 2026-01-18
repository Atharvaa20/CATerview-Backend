const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();

// 1. TRUST PROXY (First, for correct IP detection)
app.set('trust proxy', 1);

// 2. CORS (Must be BEFORE Rate Limit and Helmet)
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'https://caterview.online',
      'https://www.caterview.online',
      'https://api.caterview.online',
      'https://caterview.onrender.com'
    ].filter(Boolean).map(o => o.replace(/\/$/, ""));

    // Debug logging for CORS issues
    if (origin && !allowedOrigins.includes(origin)) {
      console.log('CORS Rejected Origin:', origin);
      console.log('Allowed Origins:', allowedOrigins);
    }

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'Accept'],
  exposedHeaders: ['set-cookie']
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// 3. SECURITY & LOGGING
app.use(helmet());
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// 4. RATE LIMITING
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later' }
});
app.use('/api/', limiter);

// 5. BODY PARSING
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 6. STATIC FILES
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 7. ROUTES
app.use('/api/auth', require('./routes/auth'));
app.use('/api/colleges', require('./routes/colleges'));
app.use('/api/experiences', require('./routes/experiences'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to CATerview API' });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Server is running' });
});

// 8. ERROR HANDLING
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: `Not found: ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
  console.error('GLOBAL ERROR:', err.message);
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message || 'Internal server error'
  });
});

module.exports = app;

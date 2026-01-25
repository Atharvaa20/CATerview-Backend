const express = require('express');
const router = express.Router();

// Import sub-routers
const authRoutes = require('./auth');
const collegeRoutes = require('./colleges');
const experienceRoutes = require('./experiences');
const notificationRoutes = require('./notifications');
const userRoutes = require('./users');
const adminRoutes = require('./admin');

// --- API Sub-Router ---
const apiRouter = express.Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/colleges', collegeRoutes);
apiRouter.use('/experiences', experienceRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/admin', adminRoutes);

// Health Check (Mapped to /api/health)
apiRouter.get('/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Mount the API sub-router under /api
router.use('/api', apiRouter);

// --- Root Route (Mapped to /) ---
router.get('/', (req, res) => {
    res.json({ message: 'Welcome to CATerview API' });
});

module.exports = router;

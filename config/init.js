const { sequelize } = require('../models');

/**
 * Initializes database connection and handles syncing logic.
 * In production, we rely on migrations, but we ensure connection is healthy.
 */
const initializeDatabase = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected.');

        if (process.env.NODE_ENV !== 'production') {
            await sequelize.sync({ alter: true });
            console.log('🔄 Models synced (Development Mode).');
        } else {
            // In production, we don't 'alter', just ensure tables exist 
            // if migrations were missed (safety net).
            await sequelize.sync();
        }
        return true;
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        return false;
    }
};

/**
 * Handles graceful shutdown of the server and database connections.
 */
const handleShutdown = (server) => {
    const close = async () => {
        console.log('\n🛑 Shutting down server...');
        server.close(async () => {
            await sequelize.close();
            console.log('💾 Database connection closed. Goodbye!');
            process.exit(0);
        });
    };

    process.on('SIGTERM', close);
    process.on('SIGINT', close);
};

module.exports = {
    initializeDatabase,
    handleShutdown
};

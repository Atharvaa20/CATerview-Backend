require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // 1. Connect to Database
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // 2. Sync Models (Only if needed)
    // Production uses migrations, so we only sync with alter in dev
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
      console.log('🔄 Database models synced.');
    } else {
      // In production, just ensure tables exist
      await sequelize.sync();
    }

    // 3. Start Listening
    const server = app.listen(PORT, () => {
      console.log(`\n🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`🌍 API: http://localhost:${PORT}/api`);
    });

    // Handle Graceful Shutdown
    const closeServer = () => {
      console.log('\n👋 Closing server and DB connection...');
      server.close(() => {
        sequelize.close().then(() => {
          console.log('💾 Connections closed. Goodbye!');
          process.exit(0);
        });
      });
    };

    process.on('SIGTERM', closeServer);
    process.on('SIGINT', closeServer);

  } catch (error) {
    console.error('❌ Unable to start server:', error.message);
    process.exit(1);
  }
}

startServer();

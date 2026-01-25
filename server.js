require('dotenv').config();
const app = require('./app');
const { initializeDatabase, handleShutdown } = require('./config/init');

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  // 1. Initialize Infrastructure (Database)
  const isDbReady = await initializeDatabase();

  if (!isDbReady) {
    console.error('System startup aborted: Database not ready.');
    process.exit(1);
  }

  // 2. Start Express Application
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server active | Origin: ${process.env.FRONTEND_URL || 'localhost'}`);
    console.log(`📡 Port: ${PORT} | Env: ${process.env.NODE_ENV || 'development'}`);
  });

  // 3. Register Process Handlers
  handleShutdown(server);
}

// Start the system
bootstrap();

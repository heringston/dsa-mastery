const app = require('./app');
const { sequelize } = require('./models');
const env = require('./config/env');

const start = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connected successfully');

    // Sync models to database (creates tables if they don't exist)
    // In production, use migrations instead of sync
    await sequelize.sync();
    console.log('Database synced');

    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port} [${env.nodeEnv}]`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();

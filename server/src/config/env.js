require('dotenv').config();

// Centralized env access — single place to see all required environment variables
const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  judge0: {
    apiUrl: process.env.JUDGE0_API_URL,
    apiKey: process.env.JUDGE0_API_KEY,
    apiHost: process.env.JUDGE0_API_HOST
  }
};

module.exports = env;

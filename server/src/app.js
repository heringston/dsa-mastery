const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const problemRoutes = require('./routes/problems');
const contestRoutes = require('./routes/contests');
const submissionRoutes = require('./routes/submissions');
const performanceRoutes = require('./routes/performance');

const app = express();

// ---- Global Middleware ----
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Rate limiting — prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests, please try again later' }
});
app.use('/api/', limiter);

// ---- Routes ----
app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/performance', performanceRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---- Error Handler (must be last) ----
app.use(errorHandler);

module.exports = app;

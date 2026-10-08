const express = require('express');
const authenticate = require('../middleware/authenticate');
const performanceService = require('../services/performanceService');
const recommendationService = require('../services/recommendationService');

const router = express.Router();

// GET /api/performance — get user's topic/pattern performance stats
router.get('/', authenticate, async (req, res, next) => {
  try {
    const stats = await performanceService.getPerformanceStats(req.user.id);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// GET /api/performance/analysis — get weakness/strength analysis
router.get('/analysis', authenticate, async (req, res, next) => {
  try {
    const analysis = await performanceService.getPerformanceAnalysis(req.user.id);
    res.json(analysis);
  } catch (error) {
    next(error);
  }
});

// GET /api/performance/recommendation — get recommended contest
router.get('/recommendation', authenticate, async (req, res, next) => {
  try {
    const recommendation = await recommendationService.getRecommendation(req.user.id);
    res.json(recommendation);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

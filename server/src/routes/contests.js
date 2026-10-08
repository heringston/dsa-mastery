const express = require('express');
const { body, query } = require('express-validator');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
const contestService = require('../services/contestService');

const router = express.Router();

// POST /api/contests — create custom contest
router.post('/', authenticate, [
  body('topics').isArray({ min: 1 }).withMessage('At least one topic required'),
  body('difficulty').notEmpty().withMessage('Difficulty required'),
  body('numProblems').isInt({ min: 1, max: 20 }).withMessage('Number of problems must be 1-20'),
  body('durationMinutes').isInt({ min: 5, max: 300 }).withMessage('Duration must be 5-300 minutes'),
  validate
], async (req, res, next) => {
  try {
    const contest = await contestService.createCustomContest(req.user.id, req.body);
    res.status(201).json({ contest });
  } catch (error) {
    next(error);
  }
});

// POST /api/contests/generate — generate system contest
router.post('/generate', authenticate, async (req, res, next) => {
  try {
    const { numProblems, durationMinutes } = req.body;
    const contest = await contestService.generateSystemContest(req.user.id, { numProblems, durationMinutes });
    res.status(201).json({ contest });
  } catch (error) {
    next(error);
  }
});

// POST /api/contests/recommended — create recommended contest from recommendation config
router.post('/recommended', authenticate, [
  body('numProblems').isInt({ min: 1, max: 20 }).withMessage('Number of problems must be 1-20'),
  body('durationMinutes').isInt({ min: 5, max: 300 }).withMessage('Duration must be 5-300 minutes'),
  validate
], async (req, res, next) => {
  try {
    const contest = await contestService.createRecommendedContest(req.user.id, req.body);
    res.status(201).json({ contest });
  } catch (error) {
    next(error);
  }
});

// GET /api/contests — list user's contests
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await contestService.getUserContests(req.user.id, { page, limit });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/contests/:id — get contest detail
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const contest = await contestService.getContestById(req.params.id, req.user.id);
    res.json({ contest });
  } catch (error) {
    next(error);
  }
});

// POST /api/contests/:id/start — start a contest
router.post('/:id/start', authenticate, async (req, res, next) => {
  try {
    const contest = await contestService.startContest(req.params.id, req.user.id);
    res.json({ contest });
  } catch (error) {
    next(error);
  }
});

// POST /api/contests/:id/end — end a contest
router.post('/:id/end', authenticate, async (req, res, next) => {
  try {
    const result = await contestService.endContest(req.params.id, req.user.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/contests/:id/result — get contest result
router.get('/:id/result', authenticate, async (req, res, next) => {
  try {
    const result = await contestService.getContestResult(req.params.id, req.user.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

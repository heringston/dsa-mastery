const express = require('express');
const authenticate = require('../middleware/authenticate');
const problemService = require('../services/problemService');
const { Topic, Pattern } = require('../models');

const router = express.Router();

// GET /api/problems — list problems with optional filters
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { topicId, patternId, difficulty, page, limit } = req.query;
    const result = await problemService.listProblems({ topicId, patternId, difficulty, page, limit });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/problems/:id — get problem detail with sample test cases
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const problem = await problemService.getProblemById(req.params.id);
    res.json({ problem });
  } catch (error) {
    next(error);
  }
});

// GET /api/topics — list all topics
router.get('/meta/topics', authenticate, async (req, res, next) => {
  try {
    const topics = await Topic.findAll({ order: [['name', 'ASC']] });
    res.json({ topics });
  } catch (error) {
    next(error);
  }
});

// GET /api/patterns — list all patterns
router.get('/meta/patterns', authenticate, async (req, res, next) => {
  try {
    const patterns = await Pattern.findAll({ order: [['name', 'ASC']] });
    res.json({ patterns });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

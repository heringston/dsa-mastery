const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
const submissionService = require('../services/submissionService');

const router = express.Router();

// POST /api/submissions — submit code
router.post('/', authenticate, [
  body('contestId').isInt().withMessage('Contest ID required'),
  body('problemId').isInt().withMessage('Problem ID required'),
  body('language').notEmpty().withMessage('Language required'),
  body('sourceCode').notEmpty().withMessage('Source code required'),
  validate
], async (req, res, next) => {
  try {
    const submission = await submissionService.submitCode({
      userId: req.user.id,
      ...req.body
    });
    res.status(201).json({ submission });
  } catch (error) {
    next(error);
  }
});

// POST /api/submissions/run — run code against sample test cases
router.post('/run', authenticate, [
  body('problemId').isInt().withMessage('Problem ID required'),
  body('language').notEmpty().withMessage('Language required'),
  body('sourceCode').notEmpty().withMessage('Source code required'),
  validate
], async (req, res, next) => {
  try {
    const results = await submissionService.runCode({
      userId: req.user.id,
      ...req.body
    });
    res.json({ results });
  } catch (error) {
    next(error);
  }
});

// GET /api/submissions/:id — get submission result
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const submission = await submissionService.getSubmissionById(req.params.id, req.user.id);
    res.json({ submission });
  } catch (error) {
    next(error);
  }
});

// GET /api/submissions/contest/:contestId — get all submissions for a contest
router.get('/contest/:contestId', authenticate, async (req, res, next) => {
  try {
    const submissions = await submissionService.getContestSubmissions(req.params.contestId, req.user.id);
    res.json({ submissions });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

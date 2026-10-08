const { Contest, ContestProblem, Problem, Topic, Pattern, Submission, sequelize } = require('../models');
const { Op } = require('sequelize');

class ContestService {
  /**
   * Create a custom contest by selecting problems matching filters.
   * The exact config is stored so the contest is reproducible.
   */
  async createCustomContest(userId, { topics, patterns, difficulty, numProblems, durationMinutes }) {
    const problems = await this._selectProblems({ topics, patterns, difficulty, numProblems });

    if (problems.length === 0) {
      const error = new Error('No problems found matching your criteria');
      error.statusCode = 400;
      throw error;
    }

    if (problems.length < numProblems) {
      // Not enough problems — warn but still create with what we have
    }

    const contest = await sequelize.transaction(async (t) => {
      const contest = await Contest.create({
        userId,
        name: this._generateContestName('CUSTOM', { topics, difficulty }),
        type: 'CUSTOM',
        status: 'PENDING',
        durationMinutes,
        config: { topics, patterns, difficulty, numProblems }
      }, { transaction: t });

      const contestProblems = problems.map((p, index) => ({
        contestId: contest.id,
        problemId: p.id,
        orderIndex: index + 1
      }));

      await ContestProblem.bulkCreate(contestProblems, { transaction: t });
      return contest;
    });

    return this.getContestById(contest.id, userId);
  }

  /**
   * Generate a system contest with a balanced mix of topics and difficulties.
   */
  async generateSystemContest(userId, { numProblems = 5, durationMinutes = 60 } = {}) {
    // Strategy: pick a mix of difficulties (1 easy, 2-3 medium, 1-2 hard)
    const easyCount = Math.max(1, Math.floor(numProblems * 0.2));
    const hardCount = Math.max(1, Math.floor(numProblems * 0.2));
    const mediumCount = numProblems - easyCount - hardCount;

    const easyProblems = await this._selectProblems({ difficulty: 'EASY', numProblems: easyCount });
    const mediumProblems = await this._selectProblems({ difficulty: 'MEDIUM', numProblems: mediumCount });
    const hardProblems = await this._selectProblems({ difficulty: 'HARD', numProblems: hardCount });

    const allProblems = [...easyProblems, ...mediumProblems, ...hardProblems];

    if (allProblems.length === 0) {
      const error = new Error('Not enough problems in the database to generate a contest');
      error.statusCode = 400;
      throw error;
    }

    const contest = await sequelize.transaction(async (t) => {
      const contest = await Contest.create({
        userId,
        name: this._generateContestName('SYSTEM_GENERATED'),
        type: 'SYSTEM_GENERATED',
        status: 'PENDING',
        durationMinutes,
        config: { numProblems, durationMinutes, strategy: 'balanced_difficulty' }
      }, { transaction: t });

      const contestProblems = allProblems.map((p, index) => ({
        contestId: contest.id,
        problemId: p.id,
        orderIndex: index + 1
      }));

      await ContestProblem.bulkCreate(contestProblems, { transaction: t });
      return contest;
    });

    return this.getContestById(contest.id, userId);
  }

  /**
   * Create a recommended contest targeting user weaknesses.
   */
  async createRecommendedContest(userId, { topics, patterns, difficulty, numProblems, durationMinutes, reason }) {
    const problems = await this._selectProblems({ topics, patterns, difficulty, numProblems });

    if (problems.length === 0) {
      const error = new Error('No problems found matching recommendation criteria');
      error.statusCode = 400;
      throw error;
    }

    const contest = await sequelize.transaction(async (t) => {
      const contest = await Contest.create({
        userId,
        name: this._generateContestName('RECOMMENDED', { topics }),
        type: 'RECOMMENDED',
        status: 'PENDING',
        durationMinutes,
        config: { topics, patterns, difficulty, numProblems, reason }
      }, { transaction: t });

      const contestProblems = problems.map((p, index) => ({
        contestId: contest.id,
        problemId: p.id,
        orderIndex: index + 1
      }));

      await ContestProblem.bulkCreate(contestProblems, { transaction: t });
      return contest;
    });

    return this.getContestById(contest.id, userId);
  }

  async getContestById(contestId, userId) {
    const contest = await Contest.findOne({
      where: { id: contestId, userId },
      include: [{
        model: Problem,
        through: { attributes: ['orderIndex'] },
        include: [
          { model: Topic, attributes: ['id', 'name'] },
          { model: Pattern, attributes: ['id', 'name'], through: { attributes: [] } }
        ]
      }],
      order: [[Problem, ContestProblem, 'orderIndex', 'ASC']]
    });

    if (!contest) {
      const error = new Error('Contest not found');
      error.statusCode = 404;
      throw error;
    }
    return contest;
  }

  async getUserContests(userId, { page = 1, limit = 10 } = {}) {
    const offset = (page - 1) * limit;
    const { rows: contests, count } = await Contest.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    return {
      contests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  async startContest(contestId, userId) {
    const contest = await Contest.findOne({ where: { id: contestId, userId } });
    if (!contest) {
      const error = new Error('Contest not found');
      error.statusCode = 404;
      throw error;
    }

    if (contest.status !== 'PENDING') {
      const error = new Error(`Contest cannot be started (current status: ${contest.status})`);
      error.statusCode = 400;
      throw error;
    }

    contest.status = 'IN_PROGRESS';
    contest.startedAt = new Date();
    await contest.save();

    return this.getContestById(contestId, userId);
  }

  async endContest(contestId, userId) {
    const contest = await Contest.findOne({ where: { id: contestId, userId } });
    if (!contest) {
      const error = new Error('Contest not found');
      error.statusCode = 404;
      throw error;
    }

    if (contest.status !== 'IN_PROGRESS') {
      const error = new Error(`Contest is not in progress (current status: ${contest.status})`);
      error.statusCode = 400;
      throw error;
    }

    contest.status = 'COMPLETED';
    contest.endedAt = new Date();
    await contest.save();

    return this.getContestResult(contestId, userId);
  }

  async getContestResult(contestId, userId) {
    const contest = await this.getContestById(contestId, userId);

    // Get all submissions for this contest
    const submissions = await Submission.findAll({
      where: { contestId, userId },
      include: [{
        model: Problem,
        include: [
          { model: Topic, attributes: ['id', 'name'] },
          { model: Pattern, attributes: ['id', 'name'], through: { attributes: [] } }
        ]
      }],
      order: [['createdAt', 'DESC']]
    });

    // Calculate per-problem results (best submission per problem)
    const problemResults = {};
    for (const sub of submissions) {
      const pid = sub.problemId;
      if (!problemResults[pid] || sub.status === 'ACCEPTED') {
        problemResults[pid] = {
          problemId: pid,
          title: sub.Problem.title,
          difficulty: sub.Problem.difficulty,
          topic: sub.Problem.Topic.name,
          patterns: sub.Problem.Patterns.map(p => p.name),
          status: sub.status,
          attempts: (problemResults[pid]?.attempts || 0) + 1,
          executionTime: sub.executionTime,
          passedTestCases: sub.passedTestCases,
          totalTestCases: sub.totalTestCases
        };
      } else {
        problemResults[pid].attempts += 1;
      }
    }

    const totalProblems = contest.Problems.length;
    const solvedCount = Object.values(problemResults).filter(r => r.status === 'ACCEPTED').length;
    const attemptedCount = Object.keys(problemResults).length;

    // Topic breakdown
    const topicBreakdown = {};
    for (const result of Object.values(problemResults)) {
      if (!topicBreakdown[result.topic]) {
        topicBreakdown[result.topic] = { attempted: 0, solved: 0 };
      }
      topicBreakdown[result.topic].attempted += 1;
      if (result.status === 'ACCEPTED') topicBreakdown[result.topic].solved += 1;
    }

    // Difficulty breakdown
    const difficultyBreakdown = {};
    for (const result of Object.values(problemResults)) {
      if (!difficultyBreakdown[result.difficulty]) {
        difficultyBreakdown[result.difficulty] = { attempted: 0, solved: 0 };
      }
      difficultyBreakdown[result.difficulty].attempted += 1;
      if (result.status === 'ACCEPTED') difficultyBreakdown[result.difficulty].solved += 1;
    }

    const startedAt = contest.startedAt ? new Date(contest.startedAt) : null;
    const endedAt = contest.endedAt ? new Date(contest.endedAt) : new Date();
    const totalTimeMinutes = startedAt ? Math.round((endedAt - startedAt) / 60000) : null;

    return {
      contest: {
        id: contest.id,
        name: contest.name,
        type: contest.type,
        status: contest.status,
        durationMinutes: contest.durationMinutes,
        startedAt: contest.startedAt,
        endedAt: contest.endedAt,
        totalTimeMinutes,
        createdAt: contest.createdAt,
        Problems: contest.Problems
      },
      summary: {
        totalProblems,
        attempted: attemptedCount,
        solved: solvedCount,
        accuracy: attemptedCount > 0 ? Math.round((solvedCount / attemptedCount) * 100) : 0,
        totalSubmissions: submissions.length
      },
      problemResults: Object.values(problemResults),
      topicBreakdown,
      difficultyBreakdown
    };
  }

  // ---- Internal helpers ----

  async _selectProblems({ topics, patterns, difficulty, numProblems = 5 } = {}) {
    const where = {};
    if (difficulty) {
      where.difficulty = Array.isArray(difficulty) ? { [Op.in]: difficulty } : difficulty;
    }
    if (topics && topics.length > 0) {
      // topics can be an array of topic IDs
      where.topicId = { [Op.in]: topics };
    }

    const include = [];
    if (patterns && patterns.length > 0) {
      include.push({
        model: Pattern,
        where: { id: { [Op.in]: patterns } },
        through: { attributes: [] }
      });
    }

    const problems = await Problem.findAll({
      where,
      include,
      order: sequelize.random(),
      limit: numProblems
    });

    return problems;
  }

  _generateContestName(type, config = {}) {
    const timestamp = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (type === 'CUSTOM') {
      return `Custom Contest - ${timestamp}`;
    } else if (type === 'RECOMMENDED') {
      return `Recommended Contest - ${timestamp}`;
    }
    return `System Contest - ${timestamp}`;
  }
}

module.exports = new ContestService();

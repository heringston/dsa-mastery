const { Problem, Topic, Pattern, TestCase } = require('../models');

class ProblemService {
  async listProblems({ topicId, patternId, difficulty, page = 1, limit = 20 } = {}) {
    const where = {};
    if (topicId) where.topicId = topicId;
    if (difficulty) where.difficulty = difficulty;

    const include = [
      { model: Topic, attributes: ['id', 'name', 'slug'] },
      { model: Pattern, attributes: ['id', 'name', 'slug'], through: { attributes: [] } }
    ];

    // If filtering by pattern, we filter through the association
    if (patternId) {
      include[1].where = { id: patternId };
    }

    const offset = (page - 1) * limit;
    const { rows: problems, count } = await Problem.findAndCountAll({
      where,
      include,
      limit,
      offset,
      order: [['id', 'ASC']],
      distinct: true
    });

    return {
      problems,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  async getProblemById(id, { includeSampleTests = true } = {}) {
    const include = [
      { model: Topic, attributes: ['id', 'name', 'slug'] },
      { model: Pattern, attributes: ['id', 'name', 'slug'], through: { attributes: [] } }
    ];

    if (includeSampleTests) {
      // Only include sample test cases — never expose hidden test cases to clients
      include.push({
        model: TestCase,
        where: { isSample: true },
        required: false,
        attributes: ['id', 'input', 'expectedOutput', 'orderIndex']
      });
    }

    const problem = await Problem.findByPk(id, { include });
    if (!problem) {
      const error = new Error('Problem not found');
      error.statusCode = 404;
      throw error;
    }
    return problem;
  }

  // Used internally by contest service — returns hidden test cases too
  async getTestCases(problemId) {
    return TestCase.findAll({
      where: { problemId },
      order: [['orderIndex', 'ASC']]
    });
  }
}

module.exports = new ProblemService();

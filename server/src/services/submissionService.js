const { Submission, Problem, Contest, ContestProblem, Topic, Pattern, TestCase } = require('../models');
const codeExecutionService = require('./codeExecutionService');
const codeWrapperService = require('./codeWrapperService');
const problemService = require('./problemService');

class SubmissionService {
  async submitCode({ userId, contestId, problemId, language, sourceCode }) {
    // Validate contest ownership and status
    const contest = await Contest.findOne({ where: { id: contestId, userId } });
    if (!contest) {
      const error = new Error('Contest not found');
      error.statusCode = 404;
      throw error;
    }
    if (contest.status !== 'IN_PROGRESS') {
      const error = new Error('Contest is not in progress');
      error.statusCode = 400;
      throw error;
    }

    // Check contest hasn't expired
    if (contest.startedAt) {
      const elapsed = (Date.now() - new Date(contest.startedAt).getTime()) / 60000;
      if (elapsed > contest.durationMinutes) {
        const error = new Error('Contest time has expired');
        error.statusCode = 400;
        throw error;
      }
    }

    // Validate problem is in this contest
    const contestProblem = await ContestProblem.findOne({
      where: { contestId, problemId }
    });
    if (!contestProblem) {
      const error = new Error('Problem is not part of this contest');
      error.statusCode = 400;
      throw error;
    }

    // Validate language
    const supportedLangs = codeExecutionService.getSupportedLanguages();
    if (!supportedLangs.includes(language)) {
      const error = new Error(`Unsupported language. Supported: ${supportedLangs.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    // Get the problem with its code configuration
    const problem = await Problem.findByPk(problemId);
    if (!problem) {
      const error = new Error('Problem not found');
      error.statusCode = 404;
      throw error;
    }

    // Create submission record
    const submission = await Submission.create({
      userId,
      contestId,
      problemId,
      language,
      sourceCode,
      status: 'PENDING'
    });

    // Get ALL test cases (including hidden ones) for judging
    const testCases = await problemService.getTestCases(problemId);
    submission.totalTestCases = testCases.length;

    try {
      // Wrap user code with the appropriate main/driver for the language
      const codeConfig = problem.codeConfiguration;
      const langConfig = codeConfig ? codeConfig[language] : null;
      const wrappedCode = codeWrapperService.wrapCode(sourceCode, language, langConfig);

      console.log(`[Submission] Executing ${language} code for problem ${problemId} against ${testCases.length} test cases`);

      // Execute code against all test cases
      const results = await codeExecutionService.executeMultiple(wrappedCode, language, testCases);

      const passedCount = results.filter(r => r.passed).length;
      submission.passedTestCases = passedCount;

      // Determine overall status
      const hasCompileError = results.some(r => r.status === 'COMPILATION_ERROR');
      const hasRuntimeError = results.some(r => r.status === 'RUNTIME_ERROR');
      const hasTLE = results.some(r => r.status === 'TIME_LIMIT_EXCEEDED');
      const hasInternalError = results.some(r => r.status === 'INTERNAL_ERROR');

      if (hasCompileError) {
        submission.status = 'COMPILATION_ERROR';
        submission.errorMessage = results.find(r => r.status === 'COMPILATION_ERROR')?.compileOutput || '';
      } else if (passedCount === testCases.length) {
        submission.status = 'ACCEPTED';
      } else if (hasTLE) {
        submission.status = 'TIME_LIMIT_EXCEEDED';
      } else if (hasRuntimeError) {
        submission.status = 'RUNTIME_ERROR';
        submission.errorMessage = results.find(r => r.status === 'RUNTIME_ERROR')?.stderr || '';
      } else if (hasInternalError) {
        submission.status = 'INTERNAL_ERROR';
        submission.errorMessage = 'Code execution service error';
      } else {
        submission.status = 'WRONG_ANSWER';
        // Include first failing test case info (without exposing hidden input/output)
        const firstFail = results.find(r => !r.passed && r.status !== 'INTERNAL_ERROR');
        if (firstFail) {
          submission.errorMessage = `Expected: ${firstFail.expectedOutput}\nGot: ${firstFail.stdout}`;
        }
      }

      // Use metrics from first successful execution
      const executedResult = results.find(r => r.time !== null);
      if (executedResult) {
        submission.executionTime = executedResult.time;
        submission.memoryUsage = executedResult.memory;
      }
    } catch (error) {
      console.error('[Submission] Execution error:', error.message);
      submission.status = 'INTERNAL_ERROR';
      submission.errorMessage = error.message;
    }

    await submission.save();

    console.log(`[Submission] Result: ${submission.status} (${submission.passedTestCases}/${submission.totalTestCases})`);

    // Return submission without source code in response
    return this.getSubmissionById(submission.id, userId);
  }

  async getSubmissionById(submissionId, userId) {
    const submission = await Submission.findOne({
      where: { id: submissionId, userId },
      include: [{
        model: Problem,
        attributes: ['id', 'title', 'difficulty'],
        include: [{ model: Topic, attributes: ['id', 'name'] }]
      }]
    });

    if (!submission) {
      const error = new Error('Submission not found');
      error.statusCode = 404;
      throw error;
    }
    return submission;
  }

  async runCode({ userId, problemId, language, sourceCode }) {
    // Validate language
    const supportedLangs = codeExecutionService.getSupportedLanguages();
    if (!supportedLangs.includes(language)) {
      const error = new Error(`Unsupported language. Supported: ${supportedLangs.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    const problem = await Problem.findByPk(problemId);
    if (!problem) {
      const error = new Error('Problem not found');
      error.statusCode = 404;
      throw error;
    }

    const testCases = await TestCase.findAll({
      where: { problemId, isSample: true },
      order: [['orderIndex', 'ASC']]
    });

    const codeConfig = problem.codeConfiguration;
    const langConfig = codeConfig ? codeConfig[language] : null;
    const wrappedCode = codeWrapperService.wrapCode(sourceCode, language, langConfig);

    const results = await codeExecutionService.executeMultiple(wrappedCode, language, testCases);
    return results;
  }

  async getContestSubmissions(contestId, userId) {
    return Submission.findAll({
      where: { contestId, userId },
      include: [{
        model: Problem,
        attributes: ['id', 'title', 'difficulty'],
        include: [{ model: Topic, attributes: ['id', 'name'] }]
      }],
      order: [['createdAt', 'DESC']]
    });
  }
}

module.exports = new SubmissionService();

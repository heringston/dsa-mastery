const { Submission, Problem, Topic, Pattern, ProblemPattern } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

/**
 * PerformanceService — computes user performance stats from submissions.
 *
 * WHY computed instead of stored:
 * Stats are always derived from the submission table, so they're never stale.
 * For the MVP, the query performance is fine. In production, cache with Redis or
 * use materialized views.
 */
class PerformanceService {
  async getPerformanceStats(userId) {
    const submissions = await Submission.findAll({
      where: { userId },
      include: [{
        model: Problem,
        include: [
          { model: Topic, attributes: ['id', 'name'] },
          { model: Pattern, attributes: ['id', 'name'], through: { attributes: [] } }
        ]
      }],
      order: [['createdAt', 'DESC']]
    });

    // For stats, we only consider the BEST submission per problem per contest
    // (a user might submit multiple times for the same problem)
    const bestSubmissions = this._getBestSubmissions(submissions);

    const topicStats = this._computeTopicStats(bestSubmissions);
    const patternStats = this._computePatternStats(bestSubmissions);

    const totalAttempted = bestSubmissions.length;
    const totalSolved = bestSubmissions.filter(s => s.status === 'ACCEPTED').length;

    return {
      overall: {
        totalAttempted,
        totalSolved,
        accuracy: totalAttempted > 0 ? Math.round((totalSolved / totalAttempted) * 100) : 0,
        totalSubmissions: submissions.length
      },
      topicStats,
      patternStats
    };
  }

  /**
   * Analyze user's weaknesses and strengths.
   * Requires minimum 3 attempts per topic/pattern before making conclusions.
   */
  async getPerformanceAnalysis(userId) {
    const stats = await this.getPerformanceStats(userId);
    const MIN_ATTEMPTS = 3;

    const weakTopics = [];
    const strongTopics = [];
    const insufficientDataTopics = [];

    for (const [topic, data] of Object.entries(stats.topicStats)) {
      if (data.attempted < MIN_ATTEMPTS) {
        insufficientDataTopics.push({ topic, ...data });
        continue;
      }
      if (data.accuracy < 50) {
        weakTopics.push({ topic, ...data });
      } else if (data.accuracy >= 70) {
        strongTopics.push({ topic, ...data });
      }
    }

    const weakPatterns = [];
    const strongPatterns = [];
    const insufficientDataPatterns = [];

    for (const [pattern, data] of Object.entries(stats.patternStats)) {
      if (data.attempted < MIN_ATTEMPTS) {
        insufficientDataPatterns.push({ pattern, ...data });
        continue;
      }
      if (data.accuracy < 50) {
        weakPatterns.push({ pattern, ...data });
      } else if (data.accuracy >= 70) {
        strongPatterns.push({ pattern, ...data });
      }
    }

    // Sort by accuracy ascending (weakest first)
    weakTopics.sort((a, b) => a.accuracy - b.accuracy);
    weakPatterns.sort((a, b) => a.accuracy - b.accuracy);

    return {
      overall: stats.overall,
      weakTopics,
      strongTopics,
      insufficientDataTopics,
      weakPatterns,
      strongPatterns,
      insufficientDataPatterns
    };
  }

  // Returns best submission per (problem, contest) pair
  _getBestSubmissions(submissions) {
    const bestMap = new Map();
    for (const sub of submissions) {
      const key = `${sub.problemId}-${sub.contestId}`;
      const existing = bestMap.get(key);
      if (!existing || sub.status === 'ACCEPTED') {
        bestMap.set(key, sub);
      }
    }
    return Array.from(bestMap.values());
  }

  _computeTopicStats(bestSubmissions) {
    const stats = {};
    for (const sub of bestSubmissions) {
      const topicName = sub.Problem.Topic.name;
      if (!stats[topicName]) {
        stats[topicName] = { attempted: 0, solved: 0, accuracy: 0 };
      }
      stats[topicName].attempted += 1;
      if (sub.status === 'ACCEPTED') stats[topicName].solved += 1;
    }
    // Calculate accuracy
    for (const data of Object.values(stats)) {
      data.accuracy = data.attempted > 0 ? Math.round((data.solved / data.attempted) * 100) : 0;
    }
    return stats;
  }

  _computePatternStats(bestSubmissions) {
    const stats = {};
    for (const sub of bestSubmissions) {
      const patterns = sub.Problem.Patterns || [];
      for (const pattern of patterns) {
        if (!stats[pattern.name]) {
          stats[pattern.name] = { attempted: 0, solved: 0, accuracy: 0 };
        }
        stats[pattern.name].attempted += 1;
        if (sub.status === 'ACCEPTED') stats[pattern.name].solved += 1;
      }
    }
    for (const data of Object.values(stats)) {
      data.accuracy = data.attempted > 0 ? Math.round((data.solved / data.attempted) * 100) : 0;
    }
    return stats;
  }
}

module.exports = new PerformanceService();

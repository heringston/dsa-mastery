const { Topic, Pattern } = require('../models');
const performanceService = require('./performanceService');

/**
 * RecommendationService — rule-based contest recommendations.
 *
 * Strategy:
 * 1. Get user's performance analysis
 * 2. Identify weakest topic and weakest pattern
 * 3. Recommend a contest targeting those areas
 * 4. Start with easier difficulty if accuracy is very low
 *
 * WHY rule-based: Simple, explainable, debuggable. AI can explain the recommendation
 * later, but should not make the selection decisions.
 */
class RecommendationService {
  async getRecommendation(userId) {
    const analysis = await performanceService.getPerformanceAnalysis(userId);

    // If no data yet, recommend a balanced system contest
    if (analysis.overall.totalAttempted === 0) {
      return {
        type: 'FIRST_TIME',
        message: 'Start with a balanced contest to establish your baseline.',
        contestConfig: null
      };
    }

    // If there are weak areas, target the weakest
    if (analysis.weakTopics.length > 0 || analysis.weakPatterns.length > 0) {
      return this._buildWeaknessRecommendation(analysis);
    }

    // If insufficient data in some areas, recommend exploring them
    if (analysis.insufficientDataTopics.length > 0) {
      return this._buildExplorationRecommendation(analysis);
    }

    // Everything is strong — suggest harder problems
    return this._buildChallengeRecommendation(analysis);
  }

  async _buildWeaknessRecommendation(analysis) {
    const weakestTopic = analysis.weakTopics[0]; // Already sorted by accuracy
    const weakestPattern = analysis.weakPatterns[0];

    // Get topic IDs
    const topicIds = [];
    if (weakestTopic) {
      const topic = await Topic.findOne({ where: { name: weakestTopic.topic } });
      if (topic) topicIds.push(topic.id);
    }

    const patternIds = [];
    if (weakestPattern) {
      const pattern = await Pattern.findOne({ where: { name: weakestPattern.pattern } });
      if (pattern) patternIds.push(pattern.id);
    }

    // If accuracy is very low (<30%), start with EASY problems
    const worstAccuracy = weakestTopic?.accuracy ?? weakestPattern?.accuracy ?? 50;
    const difficulty = worstAccuracy < 30 ? ['EASY'] : ['EASY', 'MEDIUM'];

    const reasons = [];
    if (weakestTopic) {
      reasons.push(`Your ${weakestTopic.topic} accuracy is ${weakestTopic.accuracy}% (${weakestTopic.solved}/${weakestTopic.attempted} solved)`);
    }
    if (weakestPattern) {
      reasons.push(`Your ${weakestPattern.pattern} accuracy is ${weakestPattern.accuracy}% (${weakestPattern.solved}/${weakestPattern.attempted} solved)`);
    }

    return {
      type: 'WEAKNESS_FOCUS',
      message: `Focus on your weakest areas to improve.`,
      reasons,
      contestConfig: {
        topics: topicIds,
        patterns: patternIds,
        difficulty,
        numProblems: 4,
        durationMinutes: 60,
        reason: reasons.join('. ')
      },
      targetTopic: weakestTopic?.topic || null,
      targetPattern: weakestPattern?.pattern || null
    };
  }

  _buildExplorationRecommendation(analysis) {
    const unexplored = analysis.insufficientDataTopics.slice(0, 3);
    const topicNames = unexplored.map(t => t.topic);

    return {
      type: 'EXPLORATION',
      message: `You haven't practiced enough in some topics. Try these to get a complete profile.`,
      reasons: topicNames.map(t => `${t}: insufficient data`),
      contestConfig: null, // User should create a custom contest for these
      suggestedTopics: topicNames
    };
  }

  _buildChallengeRecommendation(analysis) {
    return {
      type: 'CHALLENGE',
      message: `You're performing well across the board! Try harder problems to push yourself.`,
      reasons: ['All practiced topics above 70% accuracy'],
      contestConfig: {
        difficulty: ['MEDIUM', 'HARD'],
        numProblems: 5,
        durationMinutes: 90,
        reason: 'Challenge mode — you are performing well, time to level up.'
      }
    };
  }
}

module.exports = new RecommendationService();

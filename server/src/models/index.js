const sequelize = require('../config/database');
const User = require('./User');
const Topic = require('./Topic');
const Pattern = require('./Pattern');
const Problem = require('./Problem');
const ProblemPattern = require('./ProblemPattern');
const TestCase = require('./TestCase');
const Contest = require('./Contest');
const ContestProblem = require('./ContestProblem');
const Submission = require('./Submission');

// ---- Relationships ----

// Problem belongs to one Topic
Topic.hasMany(Problem, { foreignKey: 'topicId' });
Problem.belongsTo(Topic, { foreignKey: 'topicId' });

// Problem <-> Pattern (many-to-many)
Problem.belongsToMany(Pattern, { through: ProblemPattern, foreignKey: 'problemId' });
Pattern.belongsToMany(Problem, { through: ProblemPattern, foreignKey: 'patternId' });

// Problem has many TestCases
Problem.hasMany(TestCase, { foreignKey: 'problemId', onDelete: 'CASCADE' });
TestCase.belongsTo(Problem, { foreignKey: 'problemId' });

// User has many Contests
User.hasMany(Contest, { foreignKey: 'userId' });
Contest.belongsTo(User, { foreignKey: 'userId' });

// Contest <-> Problem (many-to-many through ContestProblem)
Contest.belongsToMany(Problem, { through: ContestProblem, foreignKey: 'contestId' });
Problem.belongsToMany(Contest, { through: ContestProblem, foreignKey: 'problemId' });
Contest.hasMany(ContestProblem, { foreignKey: 'contestId' });
ContestProblem.belongsTo(Contest, { foreignKey: 'contestId' });
ContestProblem.belongsTo(Problem, { foreignKey: 'problemId' });

// User has many Submissions
User.hasMany(Submission, { foreignKey: 'userId' });
Submission.belongsTo(User, { foreignKey: 'userId' });

// Problem has many Submissions
Problem.hasMany(Submission, { foreignKey: 'problemId' });
Submission.belongsTo(Problem, { foreignKey: 'problemId' });

// Contest has many Submissions
Contest.hasMany(Submission, { foreignKey: 'contestId' });
Submission.belongsTo(Contest, { foreignKey: 'contestId' });

module.exports = {
  sequelize,
  User,
  Topic,
  Pattern,
  Problem,
  ProblemPattern,
  TestCase,
  Contest,
  ContestProblem,
  Submission
};

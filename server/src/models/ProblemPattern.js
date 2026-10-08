const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Join table for the many-to-many relationship between Problem and Pattern
const ProblemPattern = sequelize.define('ProblemPattern', {
  problemId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'problems',
      key: 'id'
    }
  },
  patternId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'patterns',
      key: 'id'
    }
  }
}, {
  tableName: 'problem_patterns',
  timestamps: false
});

module.exports = ProblemPattern;

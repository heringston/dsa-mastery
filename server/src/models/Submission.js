const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Submission = sequelize.define('Submission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  problemId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'problems',
      key: 'id'
    }
  },
  contestId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'contests',
      key: 'id'
    }
  },
  language: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  sourceCode: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM(
      'PENDING',
      'ACCEPTED',
      'WRONG_ANSWER',
      'TIME_LIMIT_EXCEEDED',
      'RUNTIME_ERROR',
      'COMPILATION_ERROR',
      'INTERNAL_ERROR'
    ),
    defaultValue: 'PENDING'
  },
  passedTestCases: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalTestCases: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  executionTime: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  memoryUsage: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'submissions',
  timestamps: true
});

module.exports = Submission;

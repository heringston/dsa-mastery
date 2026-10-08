const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Problem = sequelize.define('Problem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  difficulty: {
    type: DataTypes.ENUM('EASY', 'MEDIUM', 'HARD'),
    allowNull: false
  },
  constraints: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  sampleInput: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  sampleOutput: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  explanation: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  codeConfiguration: {
    type: DataTypes.JSON,
    allowNull: true
  },
  topicId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'topics',
      key: 'id'
    }
  }
}, {
  tableName: 'problems',
  timestamps: true
});

module.exports = Problem;

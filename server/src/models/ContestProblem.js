const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ContestProblem = sequelize.define('ContestProblem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  contestId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'contests',
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
  orderIndex: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'contest_problems',
  timestamps: false
});

module.exports = ContestProblem;

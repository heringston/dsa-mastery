const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TestCase = sequelize.define('TestCase', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  problemId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'problems',
      key: 'id'
    }
  },
  input: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  expectedOutput: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  isSample: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  orderIndex: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'test_cases',
  timestamps: false
});

module.exports = TestCase;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Contest = sequelize.define('Contest', {
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
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('CUSTOM', 'SYSTEM_GENERATED', 'RECOMMENDED'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED'),
    defaultValue: 'PENDING'
  },
  durationMinutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 5,
      max: 300
    }
  },
  // Stores the filters used to generate this contest (for reproducibility)
  config: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  endedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'contests',
  timestamps: true
});

module.exports = Contest;

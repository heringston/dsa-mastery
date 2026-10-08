const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [2, 100]
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  passwordHash: {
    type: DataTypes.STRING(255),
    allowNull: false
  }
}, {
  tableName: 'users',
  timestamps: true,
  // Never return passwordHash in queries by default
  defaultScope: {
    attributes: { exclude: ['passwordHash'] }
  },
  scopes: {
    withPassword: {
      attributes: {}
    }
  }
});

// Hash password before saving
User.beforeCreate(async (user) => {
  user.passwordHash = await bcrypt.hash(user.passwordHash, 12);
});

User.prototype.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Ensure passwordHash is never serialized to JSON
User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.passwordHash;
  return values;
};

module.exports = User;

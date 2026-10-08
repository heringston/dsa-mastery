const jwt = require('jsonwebtoken');
const { User } = require('../models');
const env = require('../config/env');

class AuthService {
  async register({ name, email, password }) {
    // Check if email already exists
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      const error = new Error('Email already registered');
      error.statusCode = 409;
      throw error;
    }

    // Create user (password is hashed in the model's beforeCreate hook)
    const user = await User.create({
      name,
      email,
      passwordHash: password
    });

    const token = this._generateToken(user.id);
    return { user: user.toJSON(), token };
  }

  async login({ email, password }) {
    // Use withPassword scope to include passwordHash
    const user = await User.scope('withPassword').findOne({ where: { email } });
    if (!user) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const token = this._generateToken(user.id);
    return { user: user.toJSON(), token };
  }

  async getProfile(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    return user;
  }

  _generateToken(userId) {
    return jwt.sign({ userId }, env.jwt.secret, { expiresIn: env.jwt.expiresIn });
  }
}

module.exports = new AuthService();

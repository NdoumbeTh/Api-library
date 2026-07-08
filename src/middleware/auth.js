const jwt = require('jsonwebtoken');
const { Member } = require('../models');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
        message: 'Token JWT absent ou invalide. Veuillez vous connecter.'
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const member = await Member.findByPk(decoded.id, {
      attributes: { exclude: ['password_hash'] }
    });

    if (!member) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'USER_NOT_FOUND',
        message: 'Utilisateur non trouvé.'
      });
    }

    if (member.status !== 'active') {
      return res.status(403).json({
        error: 'Member suspended or inactive',
        code: 'MEMBER_INACTIVE',
        message: 'Votre compte est suspendu ou inactif.'
      });
    }

    req.user = member;
    req.userId = member.id;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'INVALID_TOKEN',
        message: 'Token JWT invalide.'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'TOKEN_EXPIRED',
        message: 'Token JWT expiré. Veuillez vous reconnecter.'
      });
    }
    next(error);
  }
};

/**
 * Optional authentication - doesn't reject if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const member = await Member.findByPk(decoded.id, {
        attributes: { exclude: ['password_hash'] }
      });
      if (member && member.status === 'active') {
        req.user = member;
        req.userId = member.id;
      }
    }
    next();
  } catch (error) {
    next();
  }
};

/**
 * Generate JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

module.exports = { authenticate, optionalAuth, generateToken };

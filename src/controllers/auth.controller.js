const bcrypt = require('bcryptjs');
const { Member } = require('../models');
const { generateToken } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

/**
 * User registration
 * POST /api/v1/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { email, password, first_name, last_name, phone, address } = req.body;

    // Check if email already exists
    const existingMember = await Member.findOne({ where: { email } });
    if (existingMember) {
      throw new AppError('Un compte existe déjà avec cet email', 409, 'EMAIL_EXISTS');
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create member
    const member = await Member.create({
      email,
      password_hash,
      first_name,
      last_name,
      phone,
      address,
      status: 'active',
      role: 'member'
    });

    // Generate token
    const token = generateToken(member);

    // Return response without password
    const memberData = member.toJSON();
    delete memberData.password_hash;

    res.status(201).json({
      message: 'Inscription réussie',
      user: memberData,
      token
    });
  } catch (error) {
    next(error);
  }
};

/**
 * User login
 * POST /api/v1/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      throw new AppError('Email et mot de passe requis', 400, 'MISSING_CREDENTIALS');
    }

    // Find member
    const member = await Member.findOne({ where: { email } });
    if (!member) {
      throw new AppError('Email ou mot de passe incorrect', 401, 'INVALID_CREDENTIALS');
    }

    // Check status
    if (member.status !== 'active') {
      throw new AppError('Member suspended or inactive', 403, 'MEMBER_INACTIVE');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, member.password_hash);
    if (!isValidPassword) {
      throw new AppError('Email ou mot de passe incorrect', 401, 'INVALID_CREDENTIALS');
    }

    // Generate token
    const token = generateToken(member);

    // Return response
    const memberData = member.toJSON();
    delete memberData.password_hash;

    res.json({
      message: 'Connexion réussie',
      user: memberData,
      token
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * GET /api/v1/auth/me
 */
const getProfile = async (req, res, next) => {
  try {
    const member = await Member.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] }
    });

    if (!member) {
      throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
    }

    res.json({ user: member });
  } catch (error) {
    next(error);
  }
};

/**
 * Update current user profile
 * PUT /api/v1/auth/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { first_name, last_name, phone, address } = req.body;

    const member = await Member.findByPk(req.user.id);
    if (!member) {
      throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
    }

    await member.update({
      first_name: first_name || member.first_name,
      last_name: last_name || member.last_name,
      phone: phone !== undefined ? phone : member.phone,
      address: address !== undefined ? address : member.address
    });

    const memberData = member.toJSON();
    delete memberData.password_hash;

    res.json({
      message: 'Profil mis à jour',
      user: memberData
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getProfile, updateProfile };

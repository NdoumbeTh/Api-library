const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { Member, Loan, Reservation, Fine } = require('../models');
const { AppError } = require('../middleware/errorHandler');

/**
 * List all members
 * GET /api/v1/members
 */
const getAllMembers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, role, q } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (role) where.role = role;
    if (q) {
      where[Op.or] = [
        { first_name: { [Op.iLike]: `%${q}%` } },
        { last_name: { [Op.iLike]: `%${q}%` } },
        { email: { [Op.iLike]: `%${q}%` } },
        { membership_number: { [Op.iLike]: `%${q}%` } }
      ];
    }

    const { count, rows } = await Member.findAndCountAll({
      where,
      attributes: { exclude: ['password_hash'] },
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']]
    });

    res.json({
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get member by ID
 * GET /api/v1/members/:id
 */
const getMemberById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const member = await Member.findByPk(id, {
      attributes: { exclude: ['password_hash'] }
    });

    if (!member) {
      throw new AppError('Adhérent non trouvé', 404, 'MEMBER_NOT_FOUND');
    }

    res.json({ data: member });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new member (admin only)
 * POST /api/v1/members
 */
const createMember = async (req, res, next) => {
  try {
    const { email, password, first_name, last_name, phone, address, role, max_loans } = req.body;

    // Check if email exists
    const existingMember = await Member.findOne({ where: { email } });
    if (existingMember) {
      throw new AppError('Un compte existe déjà avec cet email', 409, 'EMAIL_EXISTS');
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    const member = await Member.create({
      email,
      password_hash,
      first_name,
      last_name,
      phone,
      address,
      role: role || 'member',
      max_loans: max_loans || 5
    });

    const memberData = member.toJSON();
    delete memberData.password_hash;

    res.status(201).json({
      message: 'Adhérent créé avec succès',
      data: memberData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a member
 * PUT /api/v1/members/:id
 */
const updateMember = async (req, res, next) => {
  try {
    const { id } = req.params;

    const member = await Member.findByPk(id);
    if (!member) {
      throw new AppError('Adhérent non trouvé', 404, 'MEMBER_NOT_FOUND');
    }

    // If updating password, hash it
    if (req.body.password) {
      req.body.password_hash = await bcrypt.hash(req.body.password, 10);
      delete req.body.password;
    }

    await member.update(req.body);

    const memberData = member.toJSON();
    delete memberData.password_hash;

    res.json({
      message: 'Adhérent mis à jour',
      data: memberData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Partially update a member
 * PATCH /api/v1/members/:id
 */
const patchMember = async (req, res, next) => {
  try {
    const { id } = req.params;

    const member = await Member.findByPk(id);
    if (!member) {
      throw new AppError('Adhérent non trouvé', 404, 'MEMBER_NOT_FOUND');
    }

    // If updating password, hash it
    if (req.body.password) {
      req.body.password_hash = await bcrypt.hash(req.body.password, 10);
      delete req.body.password;
    }

    await member.update(req.body);

    const memberData = member.toJSON();
    delete memberData.password_hash;

    res.json({
      message: 'Adhérent mis à jour',
      data: memberData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a member
 * DELETE /api/v1/members/:id
 */
const deleteMember = async (req, res, next) => {
  try {
    const { id } = req.params;

    const member = await Member.findByPk(id);
    if (!member) {
      throw new AppError('Adhérent non trouvé', 404, 'MEMBER_NOT_FOUND');
    }

    // Check if member has active loans
    const activeLoans = await Loan.count({
      where: { member_id: id, status: 'active' }
    });

    if (activeLoans > 0) {
      throw new AppError(
        'Impossible de supprimer cet adhérent car il a des emprunts en cours',
        400,
        'MEMBER_HAS_ACTIVE_LOANS'
      );
    }

    await member.destroy();

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

/**
 * Get member loans
 * GET /api/v1/members/:id/loans
 */
const getMemberLoans = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    const member = await Member.findByPk(id);
    if (!member) {
      throw new AppError('Adhérent non trouvé', 404, 'MEMBER_NOT_FOUND');
    }

    const where = { member_id: id };
    if (status) where.status = status;

    const loans = await Loan.findAll({
      where,
      include: [{
        model: require('../models').Copy,
        as: 'copy',
        include: [{ model: require('../models').Book, as: 'book' }]
      }],
      order: [['created_at', 'DESC']]
    });

    res.json({ data: loans });
  } catch (error) {
    next(error);
  }
};

/**
 * Suspend a member
 * PATCH /api/v1/members/:id/suspend
 */
const suspendMember = async (req, res, next) => {
  try {
    const { id } = req.params;

    const member = await Member.findByPk(id);
    if (!member) {
      throw new AppError('Adhérent non trouvé', 404, 'MEMBER_NOT_FOUND');
    }

    await member.update({ status: 'suspended' });

    res.json({
      message: 'Adhérent suspendu',
      data: member
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Activate a member
 * PATCH /api/v1/members/:id/activate
 */
const activateMember = async (req, res, next) => {
  try {
    const { id } = req.params;

    const member = await Member.findByPk(id);
    if (!member) {
      throw new AppError('Adhérent non trouvé', 404, 'MEMBER_NOT_FOUND');
    }

    await member.update({ status: 'active' });

    res.json({
      message: 'Adhérent activé',
      data: member
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllMembers,
  getMemberById,
  createMember,
  updateMember,
  patchMember,
  deleteMember,
  getMemberLoans,
  suspendMember,
  activateMember
};

const { Op } = require('sequelize');
const { Fine, Loan, Member, Book, Copy } = require('../models');
const { AppError } = require('../middleware/errorHandler');

/**
 * List all fines with filters
 * GET /api/v1/fines
 */
const getAllFines = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, member_id } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (member_id) where.member_id = member_id;

    const { count, rows } = await Fine.findAndCountAll({
      where,
      include: [
        {
          model: Loan,
          as: 'loan',
          include: [{
            model: Copy,
            as: 'copy',
            include: [{ model: Book, as: 'book' }]
          }]
        },
        { model: Member, as: 'member', attributes: { exclude: ['password_hash'] } }
      ],
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
 * Get fine by ID
 * GET /api/v1/fines/:id
 */
const getFineById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const fine = await Fine.findByPk(id, {
      include: [
        {
          model: Loan,
          as: 'loan',
          include: [{
            model: Copy,
            as: 'copy',
            include: [{ model: Book, as: 'book' }]
          }]
        },
        { model: Member, as: 'member', attributes: { exclude: ['password_hash'] } }
      ]
    });

    if (!fine) {
      throw new AppError('Amende non trouvée', 404, 'FINE_NOT_FOUND');
    }

    res.json({ data: fine });
  } catch (error) {
    next(error);
  }
};

/**
 * Pay a fine
 * PATCH /api/v1/fines/:id/pay
 */
const payFine = async (req, res, next) => {
  try {
    const { id } = req.params;

    const fine = await Fine.findByPk(id);
    if (!fine) {
      throw new AppError('Amende non trouvée', 404, 'FINE_NOT_FOUND');
    }

    if (fine.status !== 'pending') {
      throw new AppError(
        'Cette amende a déjà été payée ou annulée',
        400,
        'FINE_ALREADY_PROCESSED'
      );
    }

    await fine.update({
      status: 'paid',
      paid_date: new Date()
    });

    res.json({
      message: 'Amende payée avec succès',
      data: fine
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Waive a fine (admin only)
 * PATCH /api/v1/fines/:id/waive
 */
const waiveFine = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const fine = await Fine.findByPk(id);
    if (!fine) {
      throw new AppError('Amende non trouvée', 404, 'FINE_NOT_FOUND');
    }

    if (fine.status !== 'pending') {
      throw new AppError(
        'Cette amende a déjà été traitée',
        400,
        'FINE_ALREADY_PROCESSED'
      );
    }

    await fine.update({
      status: 'waived',
      notes: `Annulée: ${reason || 'Non spécifié'}`
    });

    res.json({
      message: 'Amende annulée',
      data: fine
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get member's fines
 * GET /api/v1/fines/member/:memberId
 */
const getMemberFines = async (req, res, next) => {
  try {
    const { memberId } = req.params;

    const member = await Member.findByPk(memberId);
    if (!member) {
      throw new AppError('Adhérent non trouvé', 404, 'MEMBER_NOT_FOUND');
    }

    const fines = await Fine.findAll({
      where: { member_id: memberId },
      include: [{
        model: Loan,
        as: 'loan',
        include: [{
          model: Copy,
          as: 'copy',
          include: [{ model: Book, as: 'book' }]
        }]
      }],
      order: [['created_at', 'DESC']]
    });

    // Calculate totals
    const totalAmount = fines.reduce((sum, f) => sum + parseFloat(f.amount), 0);
    const pendingAmount = fines
      .filter(f => f.status === 'pending')
      .reduce((sum, f) => sum + parseFloat(f.amount), 0);

    res.json({
      data: fines,
      summary: {
        total: totalAmount,
        pending: pendingAmount,
        count: fines.length,
        pending_count: fines.filter(f => f.status === 'pending').length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a fine manually (librarian/admin)
 * POST /api/v1/fines
 */
const createFine = async (req, res, next) => {
  try {
    const { loan_id, amount, reason } = req.body;

    const loan = await Loan.findByPk(loan_id, {
      include: [{ model: Member, as: 'member' }]
    });

    if (!loan) {
      throw new AppError('Emprunt non trouvé', 404, 'LOAN_NOT_FOUND');
    }

    const fine = await Fine.create({
      loan_id,
      member_id: loan.member_id,
      amount,
      reason,
      status: 'pending'
    });

    res.status(201).json({
      message: 'Amende créée',
      data: fine
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a fine (admin only)
 * DELETE /api/v1/fines/:id
 */
const deleteFine = async (req, res, next) => {
  try {
    const { id } = req.params;

    const fine = await Fine.findByPk(id);
    if (!fine) {
      throw new AppError('Amende non trouvée', 404, 'FINE_NOT_FOUND');
    }

    await fine.destroy();

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllFines,
  getFineById,
  payFine,
  waiveFine,
  getMemberFines,
  createFine,
  deleteFine
};

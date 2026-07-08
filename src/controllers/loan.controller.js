const { Op } = require('sequelize');
const { Loan, Copy, Member, Book, Fine } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { sequelize } = require('../config/database');

/**
 * Create a new loan
 * POST /api/v1/loans
 */
const createLoan = async (req, res, next) => {
  try {
    const { copy_id, member_id, notes } = req.body;

    // Check copy exists
    const copy = await Copy.findByPk(copy_id, {
      include: [{ model: Book, as: 'book' }]
    });

    if (!copy) {
      throw new AppError('Book copy not found', 404, 'COPY_NOT_FOUND');
    }

    // Check if copy is available
    if (copy.status !== 'available') {
      throw new AppError('Book copy already on loan', 409, 'COPY_ALREADY_ON_LOAN');
    }

    // Check member exists and is active
    const member = await Member.findByPk(member_id);
    if (!member) {
      throw new AppError('Adhérent non trouvé', 404, 'MEMBER_NOT_FOUND');
    }

    if (member.status !== 'active') {
      throw new AppError('Member suspended or inactive', 403, 'MEMBER_INACTIVE');
    }

    // Check loan quota
    if (member.current_loans >= member.max_loans) {
      throw new AppError(
        `Loan quota exceeded for this member (max: ${member.max_loans})`,
        422,
        'LOAN_QUOTA_EXCEEDED'
      );
    }

    // Check for pending fines
    const pendingFines = await Fine.count({
      where: { member_id, status: 'pending' }
    });

    if (pendingFines > 0) {
      throw new AppError(
        'Cet adhérent a des amendes impayées',
        400,
        'PENDING_FINES'
      );
    }

    // Create loan with transaction
    const result = await sequelize.transaction(async (t) => {
      const loan = await Loan.create({
        copy_id,
        member_id,
        loan_date: new Date(),
        due_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days
        status: 'active',
        notes
      }, { transaction: t });

      // Update copy status
      await copy.update({ status: 'borrowed' }, { transaction: t });

      // Update member current loans
      await member.update(
        { current_loans: member.current_loans + 1 },
        { transaction: t }
      );

      // Update book available copies
      await Book.decrement('available_copies', {
        by: 1,
        where: { id: copy.book_id },
        transaction: t
      });

      return loan;
    });

    const createdLoan = await Loan.findByPk(result.id, {
      include: [
        { model: Copy, as: 'copy', include: [{ model: Book, as: 'book' }] },
        { model: Member, as: 'member', attributes: { exclude: ['password_hash'] } }
      ]
    });

    res.status(201).json({
      message: 'Emprunt créé avec succès',
      data: createdLoan
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get loan by ID
 * GET /api/v1/loans/:id
 */
const getLoanById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const loan = await Loan.findByPk(id, {
      include: [
        {
          model: Copy,
          as: 'copy',
          include: [{ model: Book, as: 'book' }]
        },
        { model: Member, as: 'member', attributes: { exclude: ['password_hash'] } }
      ]
    });

    if (!loan) {
      throw new AppError('Emprunt non trouvé', 404, 'LOAN_NOT_FOUND');
    }

    res.json({ data: loan });
  } catch (error) {
    next(error);
  }
};

/**
 * List all loans with filters
 * GET /api/v1/loans
 */
const getAllLoans = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, member_id, overdue } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (overdue === 'true') where.status = 'active';

    // Override due_date for overdue
    if (overdue === 'true') {
      where.due_date = { [Op.lt]: new Date() };
    }
    if (member_id) where.member_id = member_id;

    const { count, rows } = await Loan.findAndCountAll({
      where,
      include: [
        {
          model: Copy,
          as: 'copy',
          include: [{ model: Book, as: 'book' }]
        },
        {
          model: Member,
          as: 'member',
          attributes: { exclude: ['password_hash'] }
        }
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
 * Return a book
 * PATCH /api/v1/loans/:id/return
 */
const returnLoan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { condition, notes } = req.body;

    const loan = await Loan.findByPk(id, {
      include: [{ model: Copy, as: 'copy' }]
    });

    if (!loan) {
      throw new AppError('Emprunt non trouvé', 404, 'LOAN_NOT_FOUND');
    }

    if (loan.status === 'returned') {
      throw new AppError('Ce livre a déjà été retourné', 400, 'ALREADY_RETURNED');
    }

    const member = await Member.findByPk(loan.member_id);

    // Calculate fine if overdue
    let fine = null;
    const daysOverdue = loan.getDaysOverdue();
    const dailyRate = 0.50; // Could be configurable

    const result = await sequelize.transaction(async (t) => {
      // Update loan
      await loan.update({
        status: 'returned',
        return_date: new Date(),
        notes: notes || loan.notes
      }, { transaction: t });

      // Update copy status
      await loan.copy.update({
        status: 'available',
        condition: condition || loan.copy.condition
      }, { transaction: t });

      // Update member current loans
      await member.update(
        { current_loans: Math.max(0, member.current_loans - 1) },
        { transaction: t }
      );

      // Update book available copies
      await Book.increment('available_copies', {
        by: 1,
        where: { id: loan.copy.book_id },
        transaction: t
      });

      // Create fine if overdue
      if (daysOverdue > 0) {
        const fineAmount = daysOverdue * dailyRate;
        fine = await Fine.create({
          loan_id: loan.id,
          member_id: loan.member_id,
          amount: fineAmount,
          reason: `Retard de ${daysOverdue} jour(s)`,
          days_overdue: daysOverdue,
          daily_rate: dailyRate
        }, { transaction: t });
      }

      return loan;
    });

    const updatedLoan = await Loan.findByPk(id, {
      include: [
        { model: Copy, as: 'copy', include: [{ model: Book, as: 'book' }] },
        { model: Member, as: 'member', attributes: { exclude: ['password_hash'] } }
      ]
    });

    res.json({
      message: 'Livre retourné avec succès',
      data: updatedLoan,
      fine: fine ? {
        amount: fine.amount,
        days_overdue: fine.days_overdue
      } : null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Renew a loan
 * PATCH /api/v1/loans/:id/renew
 */
const renewLoan = async (req, res, next) => {
  try {
    const { id } = req.params;

    const loan = await Loan.findByPk(id, {
      include: [{ model: Copy, as: 'copy' }]
    });

    if (!loan) {
      throw new AppError('Emprunt non trouvé', 404, 'LOAN_NOT_FOUND');
    }

    if (loan.status !== 'active') {
      throw new AppError(
        'Seuls les emprunts actifs peuvent être renouvelés',
        400,
        'LOAN_NOT_ACTIVE'
      );
    }

    if (loan.renewal_count >= 1) {
      throw new AppError(
        'Cet emprunt a déjà été renouvelé une fois',
        400,
        'RENEWAL_LIMIT_EXCEEDED'
      );
    }

    // Check if there's a reservation for this book
    const reservation = await require('../models').Reservation.findOne({
      where: {
        book_id: loan.copy.book_id,
        status: 'pending'
      }
    });

    if (reservation) {
      throw new AppError(
        'Ce livre a des réservations en cours et ne peut pas être renouvelé',
        409,
        'BOOK_HAS_RESERVATIONS'
      );
    }

    // Renew the loan (extend due date by 21 days)
    const newDueDate = new Date(loan.due_date);
    newDueDate.setDate(newDueDate.getDate() + 21);

    await loan.update({
      renewal_count: loan.renewal_count + 1,
      due_date: newDueDate
    });

    const updatedLoan = await Loan.findByPk(id, {
      include: [
        { model: Copy, as: 'copy', include: [{ model: Book, as: 'book' }] },
        { model: Member, as: 'member', attributes: { exclude: ['password_hash'] } }
      ]
    });

    res.json({
      message: 'Emprunt renouvelé avec succès',
      data: updatedLoan
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get overdue loans
 * GET /api/v1/loans/overdue
 */
const getOverdueLoans = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const loans = await Loan.findAll({
      where: {
        status: 'active',
        due_date: { [Op.lt]: new Date() }
      },
      include: [
        { model: Copy, as: 'copy', include: [{ model: Book, as: 'book' }] },
        { model: Member, as: 'member', attributes: { exclude: ['password_hash'] } }
      ],
      limit: parseInt(limit),
      offset,
      order: [['due_date', 'ASC']]
    });

    // Calculate days overdue for each loan
    const loansWithOverdue = loans.map(loan => {
      const daysOverdue = loan.getDaysOverdue();
      return {
        ...loan.toJSON(),
        days_overdue: daysOverdue,
        estimated_fine: daysOverdue * 0.50
      };
    });

    res.json({ data: loansWithOverdue });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createLoan,
  getLoanById,
  getAllLoans,
  returnLoan,
  renewLoan,
  getOverdueLoans
};

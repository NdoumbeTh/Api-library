const { Op } = require('sequelize');
const { Reservation, Book, Member, Copy } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { sequelize } = require('../config/database');

/**
 * Create a reservation
 * POST /api/v1/reservations
 */
const createReservation = async (req, res, next) => {
  try {
    const { book_id, member_id, notes } = req.body;

    // Check book exists
    const book = await Book.findByPk(book_id);
    if (!book) {
      throw new AppError('Livre non trouvé', 404, 'BOOK_NOT_FOUND');
    }

    // Check member exists and is active
    const member = await Member.findByPk(member_id);
    if (!member) {
      throw new AppError('Adhérent non trouvé', 404, 'MEMBER_NOT_FOUND');
    }

    if (member.status !== 'active') {
      throw new AppError('Member suspended or inactive', 403, 'MEMBER_INACTIVE');
    }

    // Check if member already has a pending reservation for this book
    const existingReservation = await Reservation.findOne({
      where: {
        book_id,
        member_id,
        status: 'pending'
      }
    });

    if (existingReservation) {
      throw new AppError(
        'Vous avez déjà une réservation en cours pour ce livre',
        409,
        'RESERVATION_EXISTS'
      );
    }

    // Check if book is available
    const availableCopy = await Copy.findOne({
      where: { book_id, status: 'available' }
    });

    if (availableCopy) {
      throw new AppError(
        'Ce livre est disponible, vous pouvez l\'emprunter directement',
        400,
        'BOOK_AVAILABLE'
      );
    }

    // Get priority (count of pending reservations for this book)
    const currentPriority = await Reservation.count({
      where: { book_id, status: 'pending' }
    });

    // Create reservation
    const reservation = await Reservation.create({
      book_id,
      member_id,
      reservation_date: new Date(),
      expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      status: 'pending',
      priority: currentPriority + 1,
      notes
    });

    const createdReservation = await Reservation.findByPk(reservation.id, {
      include: [
        { model: Book, as: 'book' },
        { model: Member, as: 'member', attributes: { exclude: ['password_hash'] } }
      ]
    });

    res.status(201).json({
      message: 'Réservation créée avec succès',
      data: createdReservation
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get reservation by ID
 * GET /api/v1/reservations/:id
 */
const getReservationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findByPk(id, {
      include: [
        { model: Book, as: 'book' },
        { model: Member, as: 'member', attributes: { exclude: ['password_hash'] } }
      ]
    });

    if (!reservation) {
      throw new AppError('Réservation non trouvée', 404, 'RESERVATION_NOT_FOUND');
    }

    res.json({ data: reservation });
  } catch (error) {
    next(error);
  }
};

/**
 * List all reservations with filters
 * GET /api/v1/reservations
 */
const getAllReservations = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, book_id, member_id } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (book_id) where.book_id = book_id;
    if (member_id) where.member_id = member_id;

    const { count, rows } = await Reservation.findAndCountAll({
      where,
      include: [
        { model: Book, as: 'book' },
        { model: Member, as: 'member', attributes: { exclude: ['password_hash'] } }
      ],
      limit: parseInt(limit),
      offset,
      order: [['priority', 'ASC'], ['created_at', 'ASC']]
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
 * Cancel a reservation
 * PATCH /api/v1/reservations/:id/cancel
 */
const cancelReservation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findByPk(id);
    if (!reservation) {
      throw new AppError('Réservation non trouvée', 404, 'RESERVATION_NOT_FOUND');
    }

    if (reservation.status !== 'pending') {
      throw new AppError(
        'Seules les réservations en attente peuvent être annulées',
        400,
        'RESERVATION_NOT_PENDING'
      );
    }

    await reservation.update({ status: 'cancelled' });

    // Update priorities of other reservations
    await Reservation.decrement('priority', {
      by: 1,
      where: {
        book_id: reservation.book_id,
        status: 'pending',
        priority: { [Op.gt]: reservation.priority }
      }
    });

    res.json({
      message: 'Réservation annulée',
      data: reservation
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Fulfill a reservation (when book becomes available)
 * PATCH /api/v1/reservations/:id/fulfill
 */
const fulfillReservation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findByPk(id, {
      include: [{ model: Book, as: 'book' }]
    });

    if (!reservation) {
      throw new AppError('Réservation non trouvée', 404, 'RESERVATION_NOT_FOUND');
    }

    if (reservation.status !== 'pending') {
      throw new AppError(
        'Cette réservation n\'est plus en attente',
        400,
        'RESERVATION_NOT_PENDING'
      );
    }

    // Check if book is available
    const availableCopy = await Copy.findOne({
      where: { book_id: reservation.book_id, status: 'available' }
    });

    if (!availableCopy) {
      throw new AppError(
        'Le livre n\'est pas encore disponible',
        400,
        'BOOK_NOT_AVAILABLE'
      );
    }

    await reservation.update({ status: 'fulfilled' });

    res.json({
      message: 'Réservation satisfaite',
      data: reservation,
      available_copy: availableCopy
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a reservation
 * DELETE /api/v1/reservations/:id
 */
const deleteReservation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findByPk(id);
    if (!reservation) {
      throw new AppError('Réservation non trouvée', 404, 'RESERVATION_NOT_FOUND');
    }

    await reservation.destroy();

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReservation,
  getReservationById,
  getAllReservations,
  cancelReservation,
  fulfillReservation,
  deleteReservation
};

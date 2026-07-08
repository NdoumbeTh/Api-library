const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservation.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { writeLimiter } = require('../middleware/rateLimiter');

/**
 * @swagger
 * /api/v1/reservations:
 *   get:
 *     summary: List all reservations
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, fulfilled, cancelled, expired]
 *       - in: query
 *         name: book_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: member_id
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of reservations
 */
router.get('/', authenticate, reservationController.getAllReservations);

/**
 * @swagger
 * /api/v1/reservations:
 *   post:
 *     summary: Create a reservation
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - book_id
 *               - member_id
 *             properties:
 *               book_id:
 *                 type: string
 *                 format: uuid
 *               member_id:
 *                 type: string
 *                 format: uuid
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Reservation created
 *       400:
 *         description: Book is available
 *       409:
 *         description: Member already has a reservation
 */
router.post('/', authenticate, writeLimiter, reservationController.createReservation);

/**
 * @swagger
 * /api/v1/reservations/{id}:
 *   get:
 *     summary: Get reservation by ID
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Reservation details
 *       404:
 *         description: Reservation not found
 */
router.get('/:id', authenticate, reservationController.getReservationById);

/**
 * @swagger
 * /api/v1/reservations/{id}/cancel:
 *   patch:
 *     summary: Cancel a reservation
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Reservation cancelled
 *       400:
 *         description: Reservation not pending
 *       404:
 *         description: Reservation not found
 */
router.patch('/:id/cancel', authenticate, writeLimiter, reservationController.cancelReservation);

/**
 * @swagger
 * /api/v1/reservations/{id}/fulfill:
 *   patch:
 *     summary: Fulfill a reservation
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Reservation fulfilled
 *       400:
 *         description: Book not available
 */
router.patch('/:id/fulfill', authenticate, writeLimiter, authorize('librarian', 'admin'), reservationController.fulfillReservation);

/**
 * @swagger
 * /api/v1/reservations/{id}:
 *   delete:
 *     summary: Delete a reservation
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Reservation deleted
 */
router.delete('/:id', authenticate, writeLimiter, authorize('librarian', 'admin'), reservationController.deleteReservation);

module.exports = router;

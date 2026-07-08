const express = require('express');
const router = express.Router();
const fineController = require('../controllers/fine.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { writeLimiter } = require('../middleware/rateLimiter');

/**
 * @swagger
 * /api/v1/fines:
 *   get:
 *     summary: List all fines
 *     tags: [Fines]
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
 *           enum: [pending, paid, waived]
 *       - in: query
 *         name: member_id
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of fines
 */
router.get('/', authenticate, authorize('librarian', 'admin'), fineController.getAllFines);

/**
 * @swagger
 * /api/v1/fines:
 *   post:
 *     summary: Create a fine manually
 *     tags: [Fines]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - loan_id
 *               - amount
 *             properties:
 *               loan_id:
 *                 type: string
 *                 format: uuid
 *               amount:
 *                 type: number
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Fine created
 */
router.post('/', authenticate, writeLimiter, authorize('librarian', 'admin'), fineController.createFine);

/**
 * @swagger
 * /api/v1/fines/member/{memberId}:
 *   get:
 *     summary: Get member's fines
 *     tags: [Fines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Member's fines with summary
 */
router.get('/member/:memberId', authenticate, fineController.getMemberFines);

/**
 * @swagger
 * /api/v1/fines/{id}:
 *   get:
 *     summary: Get fine by ID
 *     tags: [Fines]
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
 *         description: Fine details
 *       404:
 *         description: Fine not found
 */
router.get('/:id', authenticate, fineController.getFineById);

/**
 * @swagger
 * /api/v1/fines/{id}/pay:
 *   patch:
 *     summary: Pay a fine
 *     tags: [Fines]
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
 *         description: Fine paid
 *       400:
 *         description: Fine already processed
 *       404:
 *         description: Fine not found
 */
router.patch('/:id/pay', authenticate, writeLimiter, fineController.payFine);

/**
 * @swagger
 * /api/v1/fines/{id}/waive:
 *   patch:
 *     summary: Waive a fine (admin only)
 *     tags: [Fines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Fine waived
 */
router.patch('/:id/waive', authenticate, writeLimiter, authorize('admin'), fineController.waiveFine);

/**
 * @swagger
 * /api/v1/fines/{id}:
 *   delete:
 *     summary: Delete a fine (admin only)
 *     tags: [Fines]
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
 *         description: Fine deleted
 */
router.delete('/:id', authenticate, writeLimiter, authorize('admin'), fineController.deleteFine);

module.exports = router;

const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loan.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { writeLimiter } = require('../middleware/rateLimiter');

/**
 * @swagger
 * /api/v1/loans:
 *   get:
 *     summary: List all loans with filters
 *     tags: [Loans]
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
 *           enum: [active, returned, overdue]
 *       - in: query
 *         name: member_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: overdue
 *         schema:
 *           type: boolean
 *         description: Filter overdue loans
 *     responses:
 *       200:
 *         description: List of loans
 */
router.get('/', authenticate, loanController.getAllLoans);

/**
 * @swagger
 * /api/v1/loans:
 *   post:
 *     summary: Create a new loan
 *     description: Create a loan for a book copy. Validates member status, loan quota, and copy availability.
 *     tags: [Loans]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - copy_id
 *               - member_id
 *             properties:
 *               copy_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the book copy to borrow
 *               member_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the member borrowing the book
 *               notes:
 *                 type: string
 *                 description: Optional notes
 *           examples:
 *            valid:
 *              value:
 *                copy_id: "550e8400-e29b-41d4-a716-446655440000"
 *                member_id: "550e8400-e29b-41d4-a716-446655440001"
 *                notes: "Emprunt pour lecture estivale"
 *     responses:
 *       201:
 *         description: Loan created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Loan'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Authentication required"
 *                 code:
 *                   type: string
 *                   example: "AUTH_REQUIRED"
 *                 message:
 *                   type: string
 *                   example: "Token JWT absent ou expiré. Veuillez vous connecter."
 *       403:
 *         description: Member suspended or inactive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Member suspended or inactive"
 *                 code:
 *                   type: string
 *                   example: "MEMBER_INACTIVE"
 *                 message:
 *                   type: string
 *                   example: "Votre compte est suspendu ou inactif."
 *       400:
 *         description: Invalid request body
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid request body"
 *                 code:
 *                   type: string
 *                   example: "INVALID_JSON"
 *                 message:
 *                   type: string
 *                   example: "Corps de requête invalide (JSON malformé)."
 *       404:
 *         description: Book copy not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Book copy not found"
 *                 code:
 *                   type: string
 *                   example: "COPY_NOT_FOUND"
 *                 message:
 *                   type: string
 *                   example: "Exemplaire non trouvé."
 *       409:
 *         description: Book copy already on loan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Book copy already on loan"
 *                 code:
 *                   type: string
 *                   example: "COPY_ALREADY_ON_LOAN"
 *                 message:
 *                   type: string
 *                   example: "Cet exemplaire est déjà emprunté."
 *       422:
 *         description: Loan quota exceeded for this member
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Loan quota exceeded for this member"
 *                 code:
 *                   type: string
 *                   example: "LOAN_QUOTA_EXCEEDED"
 *                 message:
 *                   type: string
 *                   example: "Limite d'emprunts atteinte (max: 5)"
 *       503:
 *         description: Service temporarily unavailable
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Service temporarily unavailable"
 *                 code:
 *                   type: string
 *                   example: "DB_UNAVAILABLE"
 *                 message:
 *                   type: string
 *                   example: "Service base de données indisponible. Veuillez réessayer ultérieurement."
 */
router.post('/', authenticate, writeLimiter, loanController.createLoan);

/**
 * @swagger
 * /api/v1/loans/overdue:
 *   get:
 *     summary: Get overdue loans
 *     tags: [Loans]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of overdue loans with days overdue and estimated fines
 */
router.get('/overdue', authenticate, authorize('librarian', 'admin'), loanController.getOverdueLoans);

/**
 * @swagger
 * /api/v1/loans/{id}:
 *   get:
 *     summary: Get loan by ID
 *     tags: [Loans]
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
 *         description: Loan details
 *       404:
 *         description: Loan not found
 */
router.get('/:id', authenticate, loanController.getLoanById);

/**
 * @swagger
 * /api/v1/loans/{id}/return:
 *   patch:
 *     summary: Return a book
 *     tags: [Loans]
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
 *               condition:
 *                 type: string
 *                 enum: [new, good, fair, poor]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Book returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Loan'
 *                 fine:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     amount:
 *                       type: number
 *                     days_overdue:
 *                       type: integer
 */
router.patch('/:id/return', authenticate, writeLimiter, loanController.returnLoan);

/**
 * @swagger
 * /api/v1/loans/{id}/renew:
 *     patch:
 *       summary: Renew a loan
 *       description: Extend the loan duration by 21 days. Can only be renewed once.
 *       tags: [Loans]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: string
 *             format: uuid
 *       responses:
 *         200:
 *           description: Loan renewed successfully
 *         400:
 *           description: Loan already renewed or not active
 *         409:
 *           description: Book has pending reservations
 */
router.patch('/:id/renew', authenticate, writeLimiter, loanController.renewLoan);

module.exports = router;

const express = require('express');
const router = express.Router();
const memberController = require('../controllers/member.controller');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { authorize, checkOwnership } = require('../middleware/role');
const { writeLimiter } = require('../middleware/rateLimiter');

/**
 * @swagger
 * /api/v1/members:
 *   get:
 *     summary: List all members
 *     tags: [Members]
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
 *           enum: [active, suspended, expired]
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [member, librarian, admin]
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: List of members
 */
router.get('/', authenticate, authorize('librarian', 'admin'), memberController.getAllMembers);

/**
 * @swagger
 * /api/v1/members:
 *   post:
 *     summary: Create a new member (admin only)
 *     tags: [Members]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - first_name
 *               - last_name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [member, librarian, admin]
 *               max_loans:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Member created
 */
router.post('/', authenticate, writeLimiter, authorize('admin'), memberController.createMember);

/**
 * @swagger
 * /api/v1/members/{id}:
 *   get:
 *     summary: Get member by ID
 *     tags: [Members]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Member details
 *       404:
 *         description: Member not found
 */
router.get('/:id', authenticate, checkOwnership(req => req.params.id), memberController.getMemberById);

/**
 * @swagger
 * /api/v1/members/{id}:
 *   put:
 *     summary: Update a member
 *     tags: [Members]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Member updated
 */
router.put('/:id', authenticate, writeLimiter, checkOwnership(req => req.params.id), memberController.updateMember);

/**
 * @swagger
 * /api/v1/members/{id}:
 *   patch:
 *     summary: Partially update a member
 *     tags: [Members]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Member updated
 */
router.patch('/:id', authenticate, writeLimiter, checkOwnership(req => req.params.id), memberController.patchMember);

/**
 * @swagger
 * /api/v1/members/{id}:
 *   delete:
 *     summary: Delete a member
 *     tags: [Members]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       204:
 *         description: Member deleted
 *       400:
 *         description: Member has active loans
 */
router.delete('/:id', authenticate, writeLimiter, authorize('admin'), memberController.deleteMember);

/**
 * @swagger
 * /api/v1/members/{id}/loans:
 *   get:
 *     summary: Get member loans
 *     tags: [Members]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, returned, overdue]
 *     responses:
 *       200:
 *         description: List of member's loans
 */
router.get('/:id/loans', authenticate, checkOwnership(req => req.params.id), memberController.getMemberLoans);

/**
 * @swagger
 * /api/v1/members/{id}/suspend:
 *   patch:
 *     summary: Suspend a member
 *     tags: [Members]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Member suspended
 */
router.patch('/:id/suspend', authenticate, authorize('librarian', 'admin'), memberController.suspendMember);

/**
 * @swagger
 * /api/v1/members/{id}/activate:
 *   patch:
 *     summary: Activate a member
 *     tags: [Members]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Member activated
 */
router.patch('/:id/activate', authenticate, authorize('librarian', 'admin'), memberController.activateMember);

module.exports = router;

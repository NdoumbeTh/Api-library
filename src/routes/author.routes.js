const express = require('express');
const router = express.Router();
const authorController = require('../controllers/author.controller');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { writeLimiter } = require('../middleware/rateLimiter');

/**
 * @swagger
 * /api/v1/authors:
 *   get:
 *     summary: List all authors
 *     tags: [Authors]
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
 *         name: q
 *         schema:
 *           type: string
 *         description: Search by author name
 *     responses:
 *       200:
 *         description: List of authors
 */
router.get('/', optionalAuth, authorController.getAllAuthors);

/**
 * @swagger
 * /api/v1/authors:
 *   post:
 *     summary: Create a new author
 *     tags: [Authors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               biography:
 *                 type: string
 *               nationality:
 *                 type: string
 *               birth_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Author created
 */
router.post('/', authenticate, writeLimiter, authorize('librarian', 'admin'), authorController.createAuthor);

/**
 * @swagger
 * /api/v1/authors/{id}:
 *   get:
 *     summary: Get author by ID with books
 *     tags: [Authors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Author details
 *       404:
 *         description: Author not found
 */
router.get('/:id', optionalAuth, authorController.getAuthorById);

/**
 * @swagger
 * /api/v1/authors/{id}:
 *   put:
 *     summary: Update an author
 *     tags: [Authors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Author updated
 */
router.put('/:id', authenticate, writeLimiter, authorize('librarian', 'admin'), authorController.updateAuthor);

/**
 * @swagger
 * /api/v1/authors/{id}:
 *   patch:
 *     summary: Partially update an author
 *     tags: [Authors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Author updated
 */
router.patch('/:id', authenticate, writeLimiter, authorize('librarian', 'admin'), authorController.patchAuthor);

/**
 * @swagger
 * /api/v1/authors/{id}:
 *   delete:
 *     summary: Delete an author
 *     tags: [Authors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Author deleted
 *       400:
 *         description: Author has books
 */
router.delete('/:id', authenticate, writeLimiter, authorize('librarian', 'admin'), authorController.deleteAuthor);

module.exports = router;

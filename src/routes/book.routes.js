const express = require('express');
const router = express.Router();
const bookController = require('../controllers/book.controller');
const authorController = require('../controllers/author.controller');
const categoryController = require('../controllers/category.controller');
const copyController = require('../controllers/copy.controller');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { writeLimiter } = require('../middleware/rateLimiter');

// ==================== BOOKS ====================

/**
 * @swagger
 * /api/v1/books:
 *   get:
 *     summary: List all books with pagination and filters
 *     tags: [Books]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: author
 *         schema:
 *           type: string
 *         description: Filter by author name
 *     responses:
 *       200:
 *         description: List of books
 */
router.get('/', optionalAuth, bookController.getAllBooks);

/**
 * @swagger
 * /api/v1/books:
 *   post:
 *     summary: Create a new book
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               isbn:
 *                 type: string
 *               publication_year:
 *                 type: integer
 *               publisher:
 *                 type: string
 *               language:
 *                 type: string
 *               page_count:
 *                 type: integer
 *               description:
 *                 type: string
 *               author_id:
 *                 type: string
 *                 format: uuid
 *               category_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Book created
 *       401:
 *         description: Authentication required
 */
router.post('/', authenticate, writeLimiter,authorize('librarian', 'admin'), bookController.createBook);

/**
 * @swagger
 * /api/v1/books/{id}:
 *   get:
 *     summary: Get book details with availability
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Book details
 *       404:
 *         description: Book not found
 */
router.get('/:id', optionalAuth, bookController.getBookById);

/**
 * @swagger
 * /api/v1/books/{id}:
 *   put:
 *     summary: Update a book (full replacement)
 *     tags: [Books]
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Book updated
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Book not found
 */
router.put('/:id', authenticate, writeLimiter, authorize('librarian', 'admin'), bookController.updateBook);

/**
 * @swagger
 * /api/v1/books/{id}:
 *   patch:
 *     summary: Partially update a book
 *     tags: [Books]
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
 *     responses:
 *       200:
 *         description: Book updated
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Book not found
 */
router.patch('/:id', authenticate, writeLimiter, authorize('librarian', 'admin'), bookController.patchBook);

/**
 * @swagger
 * /api/v1/books/{id}:
 *   delete:
 *     summary: Delete a book
 *     tags: [Books]
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
 *         description: Book deleted
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Book not found
 */
router.delete('/:id', authenticate, writeLimiter, authorize('librarian', 'admin'), bookController.deleteBook);

/**
 * @swagger
 * /api/v1/books/{id}/copies:
 *   get:
 *     summary: Get book copies
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of copies
 *       404:
 *         description: Book not found
 */
router.get('/:id/copies', optionalAuth, bookController.getBookCopies);

// ==================== COPIES ====================

/**
 * @swagger
 * /api/v1/books/{bookId}/copies:
 *   post:
 *     summary: Create a new copy for a book
 *     tags: [Copies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - inventory_number
 *             properties:
 *               inventory_number:
 *                 type: string
 *               condition:
 *                 type: string
 *                 enum: [new, good, fair, poor]
 *               location:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Copy created
 */
router.post('/:bookId/copies', authenticate, writeLimiter, authorize('librarian', 'admin'), copyController.createCopy);

/**
 * @swagger
 * /api/v1/books/{bookId}/copies/{copyId}:
 *   get:
 *     summary: Get copy details
 *     tags: [Copies]
 *     parameters:
 *       - in: path
 *         name: bookId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: copyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Copy details
 */
router.get('/:bookId/copies/:copyId', optionalAuth, copyController.getCopyById);

/**
 * @swagger
 * /api/v1/books/{bookId}/copies/{copyId}:
 *   patch:
 *     summary: Update a copy
 *     tags: [Copies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookId
 *         required: true
 *       - in: path
 *         name: copyId
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Copy updated
 */
router.patch('/:bookId/copies/:copyId', authenticate, writeLimiter, authorize('librarian', 'admin'), copyController.updateCopy);

/**
 * @swagger
 * /api/v1/books/{bookId}/copies/{copyId}:
 *   delete:
 *     summary: Delete a copy
 *     tags: [Copies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookId
 *         required: true
 *       - in: path
 *         name: copyId
 *         required: true
 *     responses:
 *       204:
 *         description: Copy deleted
 */
router.delete('/:bookId/copies/:copyId', authenticate, writeLimiter, authorize('librarian', 'admin'), copyController.deleteCopy);

module.exports = router;

const { Copy, Book } = require('../models');
const { AppError } = require('../middleware/errorHandler');

/**
 * Create a new copy for a book
 * POST /api/v1/books/:bookId/copies
 */
const createCopy = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const { inventory_number, condition, location, notes } = req.body;

    const book = await Book.findByPk(bookId);
    if (!book) {
      throw new AppError('Livre non trouvé', 404, 'BOOK_NOT_FOUND');
    }

    // Check if inventory number already exists
    const existingCopy = await Copy.findOne({ where: { inventory_number } });
    if (existingCopy) {
      throw new AppError('Un exemplaire avec ce numéro d\'inventaire existe déjà', 409, 'INVENTORY_NUMBER_EXISTS');
    }

    const copy = await Copy.create({
      book_id: bookId,
      inventory_number,
      condition: condition || 'good',
      status: 'available',
      location,
      notes
    });

    // Update book copy counts
    await Book.update({
      total_copies: book.total_copies + 1,
      available_copies: book.available_copies + 1
    }, {
      where: { id: bookId }
    });

    res.status(201).json({
      message: 'Exemplaire créé avec succès',
      data: copy
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get copy by ID
 * GET /api/v1/books/:bookId/copies/:copyId
 */
const getCopyById = async (req, res, next) => {
  try {
    const { bookId, copyId } = req.params;

    const copy = await Copy.findOne({
      where: { id: copyId, book_id: bookId },
      include: [{ model: Book, as: 'book' }]
    });

    if (!copy) {
      throw new AppError('Exemplaire non trouvé', 404, 'COPY_NOT_FOUND');
    }

    res.json({ data: copy });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a copy
 * PATCH /api/v1/books/:bookId/copies/:copyId
 */
const updateCopy = async (req, res, next) => {
  try {
    const { bookId, copyId } = req.params;

    const copy = await Copy.findOne({
      where: { id: copyId, book_id: bookId }
    });

    if (!copy) {
      throw new AppError('Exemplaire non trouvé', 404, 'COPY_NOT_FOUND');
    }

    await copy.update(req.body);

    res.json({
      message: 'Exemplaire mis à jour',
      data: copy
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a copy
 * DELETE /api/v1/books/:bookId/copies/:copyId
 */
const deleteCopy = async (req, res, next) => {
  try {
    const { bookId, copyId } = req.params;

    const copy = await Copy.findOne({
      where: { id: copyId, book_id: bookId }
    });

    if (!copy) {
      throw new AppError('Exemplaire non trouvé', 404, 'COPY_NOT_FOUND');
    }

    if (copy.status === 'borrowed') {
      throw new AppError('Impossible de supprimer un exemplaire emprunté', 400, 'COPY_BORROWED');
    }

    const book = await Book.findByPk(bookId);

    await copy.destroy();

    // Update book copy counts
    await Book.update({
      total_copies: book.total_copies - 1,
      available_copies: copy.status === 'available' ? book.available_copies - 1 : book.available_copies
    }, {
      where: { id: bookId }
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCopy,
  getCopyById,
  updateCopy,
  deleteCopy
};

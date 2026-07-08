const { Op } = require('sequelize');
const { Book, Author, Category, Copy } = require('../models');
const { AppError } = require('../middleware/errorHandler');

/**
 * List all books with pagination and filters
 * GET /api/v1/books
 */
const getAllBooks = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      q,
      genre,
      author,
      sort = 'title',
      order = 'ASC'
    } = req.query;

    const offset = (page - 1) * limit;

    // Build where clause
    const where = {};
    const include = [
      { model: Author, as: 'author', attributes: ['id', 'name', 'nationality'] },
      { model: Category, as: 'category', attributes: ['id', 'name'] }
    ];

    // Full-text search
if (q) {
  where[Op.or] = [
    { title: { [Op.like]: `%${q}%` } },
    { isbn: { [Op.like]: `%${q}%` } },
    { description: { [Op.like]: `%${q}%` } }
  ];
}

// Filter by category/genre
if (genre) {
  include[1].where = { name: { [Op.like]: `%${genre}%` } };
  include[1].required = true;
}

// Filter by author
if (author) {
  include[0].where = { name: { [Op.like]: `%${author}%` } };
  include[0].required = true;
}


    const { count, rows } = await Book.findAndCountAll({
      where,
      include,
      order: [[sort, order.toUpperCase()]],
      limit: parseInt(limit),
      offset
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
 * Get book by ID with availability
 * GET /api/v1/books/:id
 */
const getBookById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const book = await Book.findByPk(id, {
      include: [
        { model: Author, as: 'author' },
        { model: Category, as: 'category' },
        {
          model: Copy,
          as: 'copies',
          attributes: ['id', 'inventory_number', 'status', 'condition', 'location']
        }
      ]
    });

    if (!book) {
      throw new AppError('Livre non trouvé', 404, 'BOOK_NOT_FOUND');
    }

    // Calculate availability
    const availableCopies = book.copies.filter(c => c.status === 'available').length;
    const borrowedCopies = book.copies.filter(c => c.status === 'borrowed').length;

    res.json({
      ...book.toJSON(),
      availability: {
        total: book.copies.length,
        available: availableCopies,
        borrowed: borrowedCopies,
        isAvailable: availableCopies > 0
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new book
 * POST /api/v1/books
 */
const createBook = async (req, res, next) => {
  try {
    const {
      title,
      isbn,
      publication_year,
      publisher,
      language,
      page_count,
      description,
      author_id,
      category_id
    } = req.body;

    // Check if ISBN already exists
    if (isbn) {
      const existingBook = await Book.findOne({ where: { isbn } });
      if (existingBook) {
        throw new AppError('Un livre avec cet ISBN existe déjà', 409, 'ISBN_EXISTS');
      }
    }

    // Verify author exists
    if (author_id) {
      const author = await Author.findByPk(author_id);
      if (!author) {
        throw new AppError('Auteur non trouvé', 404, 'AUTHOR_NOT_FOUND');
      }
    }

    // Verify category exists
    if (category_id) {
      const category = await Category.findByPk(category_id);
      if (!category) {
        throw new AppError('Catégorie non trouvée', 404, 'CATEGORY_NOT_FOUND');
      }
    }

    const book = await Book.create({
      title,
      isbn,
      publication_year,
      publisher,
      language,
      page_count,
      description,
      author_id,
      category_id
    });

    const createdBook = await Book.findByPk(book.id, {
      include: [
        { model: Author, as: 'author' },
        { model: Category, as: 'category' }
      ]
    });

    res.status(201).json({
      message: 'Livre créé avec succès',
      data: createdBook
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a book (full replacement)
 * PUT /api/v1/books/:id
 */
const updateBook = async (req, res, next) => {
  try {
    const { id } = req.params;

    const book = await Book.findByPk(id);
    if (!book) {
      throw new AppError('Livre non trouvé', 404, 'BOOK_NOT_FOUND');
    }

    await book.update(req.body);

    const updatedBook = await Book.findByPk(id, {
      include: [
        { model: Author, as: 'author' },
        { model: Category, as: 'category' }
      ]
    });

    res.json({
      message: 'Livre mis à jour',
      data: updatedBook
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Partially update a book
 * PATCH /api/v1/books/:id
 */
const patchBook = async (req, res, next) => {
  try {
    const { id } = req.params;

    const book = await Book.findByPk(id);
    if (!book) {
      throw new AppError('Livre non trouvé', 404, 'BOOK_NOT_FOUND');
    }

    await book.update(req.body);

    const updatedBook = await Book.findByPk(id, {
      include: [
        { model: Author, as: 'author' },
        { model: Category, as: 'category' }
      ]
    });

    res.json({
      message: 'Livre mis à jour',
      data: updatedBook
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a book
 * DELETE /api/v1/books/:id
 */
const deleteBook = async (req, res, next) => {
  try {
    const { id } = req.params;

    const book = await Book.findByPk(id);
    if (!book) {
      throw new AppError('Livre non trouvé', 404, 'BOOK_NOT_FOUND');
    }

    // Check if book has borrowed copies
    const borrowedCopies = await Copy.count({
      where: { book_id: id, status: 'borrowed' }
    });

    if (borrowedCopies > 0) {
      throw new AppError(
        'Impossible de supprimer ce livre car des exemplaires sont actuellement empruntés',
        400,
        'BOOK_HAS_BORROWED_COPIES'
      );
    }

    await book.destroy();

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

/**
 * Get book copies
 * GET /api/v1/books/:id/copies
 */
const getBookCopies = async (req, res, next) => {
  try {
    const { id } = req.params;

    const book = await Book.findByPk(id);
    if (!book) {
      throw new AppError('Livre non trouvé', 404, 'BOOK_NOT_FOUND');
    }

    const copies = await Copy.findAll({
      where: { book_id: id }
    });

    res.json({ data: copies });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  patchBook,
  deleteBook,
  getBookCopies
};

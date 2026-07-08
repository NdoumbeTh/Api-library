const { Author, Book } = require('../models');
const { AppError } = require('../middleware/errorHandler');

/**
 * List all authors
 * GET /api/v1/authors
 */
const getAllAuthors = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, q } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (q) {
      where.name = { [require('sequelize').Op.iLike]: `%${q}%` };
    }

    const { count, rows } = await Author.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['name', 'ASC']]
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
 * Get author by ID
 * GET /api/v1/authors/:id
 */
const getAuthorById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const author = await Author.findByPk(id, {
      include: [{
        model: Book,
        as: 'books',
        attributes: ['id', 'title', 'isbn', 'publication_year']
      }]
    });

    if (!author) {
      throw new AppError('Auteur non trouvé', 404, 'AUTHOR_NOT_FOUND');
    }

    res.json({ data: author });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new author
 * POST /api/v1/authors
 */
const createAuthor = async (req, res, next) => {
  try {
    const { name, biography, nationality, birth_date } = req.body;

    const author = await Author.create({
      name,
      biography,
      nationality,
      birth_date
    });

    res.status(201).json({
      message: 'Auteur créé avec succès',
      data: author
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an author
 * PUT /api/v1/authors/:id
 */
const updateAuthor = async (req, res, next) => {
  try {
    const { id } = req.params;

    const author = await Author.findByPk(id);
    if (!author) {
      throw new AppError('Auteur non trouvé', 404, 'AUTHOR_NOT_FOUND');
    }

    await author.update(req.body);

    res.json({
      message: 'Auteur mis à jour',
      data: author
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Partially update an author
 * PATCH /api/v1/authors/:id
 */
const patchAuthor = async (req, res, next) => {
  try {
    const { id } = req.params;

    const author = await Author.findByPk(id);
    if (!author) {
      throw new AppError('Auteur non trouvé', 404, 'AUTHOR_NOT_FOUND');
    }

    await author.update(req.body);

    res.json({
      message: 'Auteur mis à jour',
      data: author
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an author
 * DELETE /api/v1/authors/:id
 */
const deleteAuthor = async (req, res, next) => {
  try {
    const { id } = req.params;

    const author = await Author.findByPk(id);
    if (!author) {
      throw new AppError('Auteur non trouvé', 404, 'AUTHOR_NOT_FOUND');
    }

    // Check if author has books
    const booksCount = await Book.count({ where: { author_id: id } });
    if (booksCount > 0) {
      throw new AppError(
        'Impossible de supprimer cet auteur car il a des livres associés',
        400,
        'AUTHOR_HAS_BOOKS'
      );
    }

    await author.destroy();

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllAuthors,
  getAuthorById,
  createAuthor,
  updateAuthor,
  patchAuthor,
  deleteAuthor
};

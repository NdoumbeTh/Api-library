const { Category, Book } = require('../models');
const { AppError } = require('../middleware/errorHandler');

/**
 * List all categories
 * GET /api/v1/categories
 */
const getAllCategories = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Category.findAndCountAll({
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
 * Get category by ID
 * GET /api/v1/categories/:id
 */
const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id, {
      include: [{
        model: Book,
        as: 'books',
        attributes: ['id', 'title', 'isbn']
      }]
    });

    if (!category) {
      throw new AppError('Catégorie non trouvée', 404, 'CATEGORY_NOT_FOUND');
    }

    res.json({ data: category });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new category
 * POST /api/v1/categories
 */
const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    // Check if category with same name exists
    const existingCategory = await Category.findOne({
      where: { name: { [require('sequelize').Op.iLike]: name } }
    });

    if (existingCategory) {
      throw new AppError('Une catégorie avec ce nom existe déjà', 409, 'CATEGORY_EXISTS');
    }

    const category = await Category.create({ name, description });

    res.status(201).json({
      message: 'Catégorie créée avec succès',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a category
 * PUT /api/v1/categories/:id
 */
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);
    if (!category) {
      throw new AppError('Catégorie non trouvée', 404, 'CATEGORY_NOT_FOUND');
    }

    await category.update(req.body);

    res.json({
      message: 'Catégorie mise à jour',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Partially update a category
 * PATCH /api/v1/categories/:id
 */
const patchCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);
    if (!category) {
      throw new AppError('Catégorie non trouvée', 404, 'CATEGORY_NOT_FOUND');
    }

    await category.update(req.body);

    res.json({
      message: 'Catégorie mise à jour',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a category
 * DELETE /api/v1/categories/:id
 */
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);
    if (!category) {
      throw new AppError('Catégorie non trouvée', 404, 'CATEGORY_NOT_FOUND');
    }

    // Check if category has books
    const booksCount = await Book.count({ where: { category_id: id } });
    if (booksCount > 0) {
      throw new AppError(
        'Impossible de supprimer cette catégorie car elle contient des livres',
        400,
        'CATEGORY_HAS_BOOKS'
      );
    }

    await category.destroy();

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  patchCategory,
  deleteCategory
};

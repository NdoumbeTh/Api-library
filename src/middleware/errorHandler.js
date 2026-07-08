/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => ({
      field: e.path,
      message: e.message,
      type: e.type
    }));
    return res.status(400).json({
      error: 'Validation error',
      code: 'VALIDATION_ERROR',
      message: 'Données invalides',
      details: errors
    });
  }

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0]?.path || 'field';
    return res.status(409).json({
      error: 'Duplicate entry',
      code: 'DUPLICATE_ENTRY',
      message: `Un enregistrement avec ce ${field} existe déjà.`,
      field: field
    });
  }

  // Sequelize foreign key constraint error
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      error: 'Foreign key constraint error',
      code: 'FK_CONSTRAINT_ERROR',
      message: 'Référence invalide. L\'élément référencé n\'existe pas.'
    });
  }

  // Sequelize database connection error
  if (err.name === 'SequelizeConnectionError' ||
      err.name === 'SequelizeConnectionRefusedError' ||
      err.name === 'SequelizeHostNotFoundError') {
    return res.status(503).json({
      error: 'Service temporarily unavailable',
      code: 'DB_UNAVAILABLE',
      message: 'Service base de données indisponible. Veuillez réessayer ultérieurement.'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'INVALID_TOKEN',
      message: 'Token JWT invalide.'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'TOKEN_EXPIRED',
      message: 'Token JWT expiré.'
    });
  }

  // Syntax error (malformed JSON)
  if (err.name === 'SyntaxError' && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Invalid request body',
      code: 'INVALID_JSON',
      message: 'Corps de requête invalide (JSON malformé).'
    });
  }

  // Custom application errors
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.name || 'Application error',
      code: err.code || 'APP_ERROR',
      message: err.message
    });
  }

  // Default server error
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'development'
      ? err.message
      : 'Une erreur interne est survenue.'
  });
};

/**
 * Custom error class for application errors
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'APP_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not found handler
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Not found',
    code: 'NOT_FOUND',
    message: `Ressource non trouvée: ${req.method} ${req.originalUrl}`
  });
};

module.exports = { errorHandler, AppError, notFoundHandler };

/**
 * Role-based authorization middleware
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
        message: 'Authentification requise.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Vous n\'avez pas les permissions nécessaires.'
      });
    }

    next();
  };
};

/**
 * Check if user owns the resource or is admin/librarian
 */
const checkOwnership = (getOwnerId) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
          message: 'Authentification requise.'
        });
      }

      // Admin and librarian have full access
      if (['admin', 'librarian'].includes(req.user.role)) {
        return next();
      }

      const ownerId = await getOwnerId(req);

      if (req.user.id !== ownerId) {
        return res.status(403).json({
          error: 'Forbidden',
          code: 'NOT_OWNER',
          message: 'Vous n\'êtes pas autorisé à accéder à cette ressource.'
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { authorize, checkOwnership };

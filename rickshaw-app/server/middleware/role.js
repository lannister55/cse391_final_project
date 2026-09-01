/**
 * Role-based access control middleware.
 *
 * Usage: router.get('/admin-only', auth, allowRoles('ADMIN'), handler)
 *
 * @param  {...string} roles - One or more allowed role strings
 * @returns Express middleware
 */
const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access forbidden. Required role(s): ${roles.join(', ')}`,
      });
    }
    next();
  };
};

export { allowRoles };

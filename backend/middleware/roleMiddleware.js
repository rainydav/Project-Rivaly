const { expandRoles } = require("../utils/roleAliases");

module.exports = function (roles) {
  return (req, res, next) => {
    const allowedRoles = expandRoles(roles);

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied",
        requiredRoles: allowedRoles,
        actualRole: req.user.role,
      });
    }
    next();
  };
};

/**
 * Розширення ролей для middleware: наприклад, admin може включати додаткові права.
 * organizer додано для маршрутів створення контенту (поряд з admin).
 */
const roleGroups = {
  participant: ["participant"],
  judge: ["judge"],
  admin: ["admin"],
  organizer: ["organizer"],
};

const expandRoles = (roles) => {
  return roles.flatMap((role) => roleGroups[role] || [role]);
};

module.exports = {
  expandRoles,
};

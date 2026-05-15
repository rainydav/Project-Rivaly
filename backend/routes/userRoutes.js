const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// GET ALL (ONLY ADMIN)
router.get(
  "/all",
  authMiddleware,
  roleMiddleware(["admin"]),
  userController.getUsers
);

router.get("/search", authMiddleware, userController.searchUsers);

// UPDATE ROLE (ONLY ADMIN)
router.put(
  "/role/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  userController.updateUserRole
);

router.get("/:id", authMiddleware, userController.getUserById);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  userController.deleteUser
);

module.exports = router;
const express = require("express");
const router = express.Router();

const controller = require("../controllers/profileController");
const auth = require("../middleware/authMiddleware");

/** Поточний профіль (розширений) */
router.get("/me", auth, controller.getProfile);

/** Оновлення імені, біо, аватара тощо — узгоджено з фронтендом Rivaly */
router.patch("/me", auth, controller.updateProfile);

/** Зафіксувати завершення курсу (збільшує lifetimeStats.coursesCompleted один раз на courseId) */
router.post("/me/complete-course", auth, controller.completeCourse);

module.exports = router;

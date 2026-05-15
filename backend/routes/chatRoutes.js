const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const roles = require("../middleware/roleMiddleware");
const chatController = require("../controllers/chatController");

router.get("/messages", auth, chatController.listMessages);
router.post("/messages", auth, chatController.postMessage);
router.delete("/messages/:id", auth, roles(["admin"]), chatController.deleteMessage);

module.exports = router;

/* AUTH MIDDLEWARE */

const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async function (req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_SECRET);
    const user = await User.findById(decoded.id).select("role email username");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

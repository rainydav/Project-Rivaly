const { setServers } = require("node:dns/promises");
setServers(["1.1.1.1", "8.8.8.8"]);

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Atlas connected");
  } catch (err) {
    console.log(err);
  }
};

module.exports = connectDB;
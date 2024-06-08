const mongoose = require("mongoose");
const config = require("../config");

const connectDB = async () => {
  console.log(config.MONGO_URI);
  try {
    const db = await mongoose.connect(config.MONGO_URI, {
      bufferCommands: false,
    });
    console.log("Successfully connected to MongoDB!");

    return db;
  } catch (err) {
    console.error(err.message);
    process.exit(-1);
  }
};

module.exports = connectDB;

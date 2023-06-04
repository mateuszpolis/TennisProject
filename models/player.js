const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  birthdate: {
    type: Date,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  picture: {
    type: String,
    default: "N/A",
  },
});

module.exports = mongoose.model("Player", playerSchema);

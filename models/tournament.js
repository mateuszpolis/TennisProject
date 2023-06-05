const mongoose = require("mongoose");

const tournamentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  location: {
    type: String,
    required: true,
  },
  tournamentRank: {
    type: Number,
    required: true,
  }
});

module.exports = mongoose.model("Tournament", tournamentSchema);
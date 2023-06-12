const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema({
  player1: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Player",
  },
  player2: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Player",
  },
  odds1: {
    type: Number,
    required: true,
  },
  odds2: {
    type: Number,
    required: true,
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Player",
  },
  date: {
    type: Date,
    required: true,
  },
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Tournament",
  },
  biorythmPhysical1: {
    type: Number,
  },
  biorythmPhysical2: {
    type: Number,
  },
  biorythmEmotional1: {
    type: Number,
  },
  biorythmEmotional2: {
    type: Number,
  },
  biorythmIntelectual1: {
    type: Number,
  },
  biorythmIntelectual2: {
    type: Number,
  },
  result1: {
    type: Number,
    required: true,
    default: 0,
  },
  result2: {
    type: Number,
    required: true,
    default: 0,
  },
});

module.exports = mongoose.model("Match", matchSchema);

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
  playerName1: {
    type: String,
    default: "",
  },
  playerName2: {
    type: String,
    default: "",
  },
  winnerName: { 
    type: String,
    default: "",  
  },
  tournamentName: { 
    type: String,
    default: "", 
  },
});

module.exports = mongoose.model("Match", matchSchema);

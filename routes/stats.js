const express = require("express");
const router = express.Router();
const Match = require("../models/match");
const Player = require("../models/player");
const Tournament = require("../models/tournament");

// All Stats Route
router.get("/", async (req, res) => {
  const matches = await Match.find({})
    .populate("player1")
    .populate("player2")
    .populate("winner")
    .populate("tournament")
    .exec();

  const nOfMatches = Object.keys(matches).length;
  let nOfMatchesWithBiorythmPhysical = 0;
  let nOfMatchesWithBiorythmEmotional = 0;
  let nOfMatchesWithBiorythmIntellectual = 0;
  for (const match of matches) {
    if (match.player1?.id === match.winner?.id) {
      if (match.biorythmPhysical1 > match.biorythmPhysical2) {
        nOfMatchesWithBiorythmPhysical++;
      }
      if (match.biorythmEmotional1 > match.biorythmEmotional2) {
        nOfMatchesWithBiorythmEmotional++;
      }
      if (match.biorythmIntelectual1 > match.biorythmIntelectual2) {
        nOfMatchesWithBiorythmIntellectual++;
      }
    } else if (match.player2?.id === match.winner?.id) {
      if (match.biorythmPhysical2 > match.biorythmPhysical1) {
        nOfMatchesWithBiorythmPhysical++;
      }
      if (match.biorythmEmotional2 > match.biorythmEmotional1) {
        nOfMatchesWithBiorythmEmotional++;
      }
      if (match.biorythmIntelectual2 > match.biorythmIntelectual1) {
        nOfMatchesWithBiorythmIntellectual++;
      }
    }
  }
  res.render("stats/index", {
    stats: {
      allMatches: nOfMatches,
      biorythmPhysical: nOfMatchesWithBiorythmPhysical,
      biorythmEmotional: nOfMatchesWithBiorythmEmotional,
      biorythmIntellectual: nOfMatchesWithBiorythmIntellectual,
    },
  });
});

module.exports = router;

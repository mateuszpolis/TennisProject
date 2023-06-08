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
  let nOfMatchesWithBiorythm = 0;
  for (const match of matches) {
    let check = true;
    if (match.player1?.id === match.winner?.id) {
      if (match.biorythmPhysical1 > match.biorythmPhysical2) {
        check = true;
      } else {
        check = false;
      }
    } else if (match.player2?.id === match.winner?.id) {
      if (match.biorythmPhysical2 > match.biorythmPhysical1) {
        check = true;
      } else {
        check = false;
      }
    }
    if (check) {
      nOfMatchesWithBiorythm++;
    }
  }
  res.render("stats/index", {
    stats: {
      allMatches: nOfMatches,
      biorythmPhysical: nOfMatchesWithBiorythm,
    },
  });
});

module.exports = router;

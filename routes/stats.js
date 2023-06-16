const express = require("express");
const router = express.Router();
const Match = require("../models/match");
const Player = require("../models/player");
const Tournament = require("../models/tournament");

// All Stats Route
router.get("/", async (req, res) => {
  let params = {
    surface: {
      clay: false,
      grass: false,
      hard: false,
    },
    oddsDifferenceMax: 1000,
    oddsDifferenceMin: 0,
  };
  let matchesBeforeFilter = await Match.find({})
    .populate("player1")
    .populate("player2")
    .populate("winner")
    .populate("tournament")
    .populate("predictedWinner")
    .exec();
  let matchesAfterFilter = [];

  // Filter surfaces
  if (req.query.clay == "on") {
    params.surface.clay = true;
  }
  if (req.query.grass == "on") {
    params.surface.grass = true;
  }
  if (req.query.hard == "on") {
    params.surface.hard = true;
  }
  matchesAfterFilter = matchesBeforeFilter.filter((match) => {
    if (params.surface.clay && match.tournament.surface === "Clay") {
      return true;
    } else if (params.surface.grass && match.tournament.surface === "Grass") {
      return true;
    } else if (params.surface.hard && match.tournament.surface === "Hard") {
      return true;
    } else if (
      !params.surface.clay &&
      !params.surface.grass &&
      !params.surface.hard
    ) {
      return true;
    } else {
      return false;
    }
  });
  // Filter odds
  console.log(req.query.oddsDifference);
  matchesBeforeFilter = matchesAfterFilter;

  if (
    req.query.oddsDifferenceMax == null ||
    req.query.oddsDifferenceMax == ""
  ) {
    params.oddsDifferenceMax = 1000;
  } else {
    params.oddsDifferenceMax = req.query.oddsDifferenceMax;
  }
  if (
    req.query.oddsDifferenceMin == null ||
    req.query.oddsDifferenceMin == ""
  ) {
    params.oddsDifferenceMin = 0;
  } else {
    params.oddsDifferenceMin = req.query.oddsDifferenceMin;
  }
  console.log(params.oddsDifferenceMax);
  console.log(params.oddsDifferenceMin);
  matchesAfterFilter = matchesBeforeFilter.filter((match) => {
    if (
      match.odds1 != null &&
      match.odds2 != null &&
      Math.abs(match.odds1 - match.odds2) <= params.oddsDifferenceMax &&
      Math.abs(match.odds1 - match.odds2) >= params.oddsDifferenceMin
    ) {
      return true;
    } else {
      return false;
    }
  });

  const nOfMatches = Object.keys(matchesAfterFilter).length;
  let nOfMatchesWithBiorythmPhysical = 0;
  let nOfMatchesWithBiorythmEmotional = 0;
  let nOfMatchesWithBiorythmIntellectual = 0;
  let nOfMatchesWithPredictedWinner = 0;
  let nOfMatchesWithPredictedWinnerCorrect = 0;
  for (const match of matchesAfterFilter) {
    if (match.predictedWinner != null) {
      nOfMatchesWithPredictedWinner++;
      if (match.predictedWinner?.id === match.winner?.id) {
        nOfMatchesWithPredictedWinnerCorrect++;
      }
    }
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
      predictions: nOfMatchesWithPredictedWinner,
      correctPredictions: nOfMatchesWithPredictedWinnerCorrect,
    },
    params: params,
  });
});

module.exports = router;

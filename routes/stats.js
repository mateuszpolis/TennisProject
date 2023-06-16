const express = require("express");
const router = express.Router();
const Match = require("../models/match");
const Player = require("../models/player");
const Tournament = require("../models/tournament");
const { isNullOrUndefined } = require("util");

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
    tournament: null,
    biorythmPhysical: false,
    biorythmEmotional: false,
    biorythmIntellectual: false,
    lowerOdds: false,
    higherOdds: false,
    prediction: false,
    tournamentRank: null,
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

  // Filter general odds
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

  // Filter tournament rank
  matchesBeforeFilter = matchesAfterFilter;
  if (
    req.query.tournamentRank != null &&
    req.query.tournamentRank != "" &&
    req.query.tournamentRank != "0"
  ) {
    params.tournamentRank = req.query.tournamentRank;
  }
  matchesAfterFilter = matchesBeforeFilter.filter((match) => {
    if (
      params.tournamentRank != null &&
      match.tournament.tournamentRank != params.tournamentRank
    ) {
      return false;
    }
    return true;
  });

  // Filter tournament
  matchesBeforeFilter = matchesAfterFilter;
  if (req.query.tournament != null && req.query.tournament != "") {
    params.tournament = req.query.tournament;
  }
  matchesAfterFilter = matchesBeforeFilter.filter((match) => {
    if (
      params.tournament != null &&
      params.tournament != "" &&
      match.tournament.id === params.tournament
    ) {
      return true;
    } else if (params.tournament == null || params.tournament == "") {
      return true;
    } else {
      return false;
    }
  });

  const matchesFromLength = Object.keys(matchesAfterFilter).length;

  // Filter biorythm
  matchesBeforeFilter = matchesAfterFilter;
  if (req.query.biorythmPhysical == "on") {
    params.biorythmPhysical = true;
  }
  if (req.query.biorythmEmotional == "on") {
    params.biorythmEmotional = true;
  }
  if (req.query.biorythmIntellectual == "on") {
    params.biorythmIntellectual = true;
  }
  matchesAfterFilter = matchesBeforeFilter.filter((match) => {
    let winnerPhysical;
    let winnerEmotional;
    let winnerIntellectual;
    let loserPhysical;
    let loserEmotional;
    let loserIntellectual;
    if (match.player1?.id === match.winner?.id) {
      winnerPhysical = match.biorythmPhysical1;
      winnerEmotional = match.biorythmEmotional1;
      winnerIntellectual = match.biorythmIntelectual1;
      loserPhysical = match.biorythmPhysical2;
      loserEmotional = match.biorythmEmotional2;
      loserIntellectual = match.biorythmIntelectual2;
    } else if (match.player2?.id === match.winner?.id) {
      winnerPhysical = match.biorythmPhysical2;
      winnerEmotional = match.biorythmEmotional2;
      winnerIntellectual = match.biorythmIntelectual2;
      loserPhysical = match.biorythmPhysical1;
      loserEmotional = match.biorythmEmotional1;
      loserIntellectual = match.biorythmIntelectual1;
    }
    if (params.biorythmPhysical && winnerPhysical <= loserPhysical) {
      return false;
    }
    if (params.biorythmEmotional && winnerEmotional <= loserEmotional) {
      return false;
    }
    if (
      params.biorythmIntellectual &&
      winnerIntellectual <= loserIntellectual
    ) {
      return false;
    }
    return true;
  });

  // Filter winner odds
  matchesBeforeFilter = matchesAfterFilter;
  if (req.query.lowerOdds == "on") {
    params.lowerOdds = true;
  }
  if (req.query.higherOdds == "on") {
    params.higherOdds = true;
  }
  matchesAfterFilter = matchesBeforeFilter.filter((match) => {
    let winnerOdds;
    let loserOdds;
    if (match.player1?.id === match.winner?.id) {
      winnerOdds = match.odds1;
      loserOdds = match.odds2;
    } else {
      winnerOdds = match.odds2;
      loserOdds = match.odds1;
    }
    if (params.lowerOdds && winnerOdds >= loserOdds) {
      return false;
    } else if (params.higherOdds && winnerOdds <= loserOdds) {
      return false;
    }
    return true;
  });

  // Filter prediction
  matchesBeforeFilter = matchesAfterFilter;
  if (req.query.prediction == "on") {
    params.prediction = true;
  }
  matchesAfterFilter = matchesBeforeFilter.filter((match) => {
    if (
      params.prediction &&
      match.predictedWinner != null &&
      match.winner.id != match.predictedWinner.id
    ) {
      return false;
    }
    return true;
  });

  const matchesSelectedLength = Object.keys(matchesAfterFilter).length;
  const percentage = (matchesSelectedLength / matchesFromLength) * 100;
  const tournaments = await Tournament.find({}).exec();
  matchesAfterFilter.sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });

  res.render("stats/index", {
    matchesFromLength: matchesFromLength,
    matchesSelectedLength: matchesSelectedLength,
    percentage: percentage.toPrecision(3),
    params: params,
    tournaments: tournaments,
    filteredMatches: matchesAfterFilter,
  });
});

module.exports = router;

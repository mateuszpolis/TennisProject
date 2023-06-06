const express = require("express");
const router = express.Router();
const Match = require("../models/match");
const Player = require("../models/player");
const Tournament = require("../models/tournament");

// All Matches Route
router.get("/", async (req, res) => {
  let searchOptions = {};
  if (req.query.player1 != null && req.query.player1 !== "") {
    searchOptions.player1 = new RegExp(req.query.player1, "i");
  }
  if (req.query.player2 != null && req.query.player2 !== "") {
    searchOptions.player2 = new RegExp(req.query.player2, "i");
  }
  try {
    const matches = await Match.find(searchOptions);
    res.render("matches/index", { matches: matches, searchOptions: req.query });
  } catch {
    res.redirect("/");
  }
});

// New Match Route
router.get("/new", async (req, res) => {
  renderNewPage(res, new Match());
});

// Create Match Route
router.post("/", async (req, res) => {
  const winner =
    req.body.winner === "player1" ? req.body.player1 : req.body.player2;
  const biorythms = await calculateBiorythms(
    req.body.date,
    req.body.player1,
    req.body.player2,
    winner,
    req.body.tournament
  );

  console.log(biorythms);

  const match = new Match({
    player1: req.body.player1,
    player2: req.body.player2,
    odds1: req.body.odds1,
    odds2: req.body.odds2,
    winner: winner,
    date: new Date(req.body.date),
    tournament: req.body.tournament,
    biorythmPhysical1: biorythms.physical1.toPrecision(3),
    biorythmEmotional1: biorythms.emotional1.toPrecision(3),
    biorythmPhysical2: biorythms.physical2.toPrecision(3),
    biorythmEmotional2: biorythms.emotional2.toPrecision(3),
    playerName1: biorythms.playerName1,
    playerName2: biorythms.playerName2,
    winnerName: biorythms.winnerName,
    tournamentName: biorythms.tournamentName,
  });
  try {
    await match.save();
    res.redirect("matches");
  } catch {
    renderNewPage(res, match, true);
  }
});

module.exports = router;

async function renderNewPage(res, match, hasError = false) {
  try {
    const players = await Player.find({});
    const tournaments = await Tournament.find({});
    const params = {
      players: players,
      match: match,
      tournaments: tournaments,
    };
    if (hasError) params.errorMessage = "Error Creating Match";
    res.render("matches/new", params);
  } catch {
    res.redirect("/matches");
  }
}

async function calculateBiorythms(date, player1, player2, winner, tournament) {
  date = new Date(date);
  let diffTime1, diffDays1, diffTime2, diffDays2;

  player1 = await Player.findById(player1);
  player2 = await Player.findById(player2);
  winner = await Player.findById(winner);
  tournament = await Tournament.findById(tournament);

  birthdate1 = new Date(player1.birthdate);
  diffTime1 = Math.abs(date.getTime() - birthdate1.getTime());
  diffDays1 = Math.ceil(diffTime1 / (1000 * 60 * 60 * 24));
  birthdate2 = new Date(player2.birthdate);
  diffTime2 = Math.abs(date.getTime() - birthdate2.getTime());
  diffDays2 = Math.ceil(diffTime2 / (1000 * 60 * 60 * 24));

  return {
    physical1: Math.sin((2 * Math.PI * diffDays1) / 23),
    emotional1: Math.sin((2 * Math.PI * diffDays1) / 28),
    physical2: Math.sin((2 * Math.PI * diffDays2) / 23),
    emotional2: Math.sin((2 * Math.PI * diffDays2) / 28),
    playerName1: player1.name,
    playerName2: player2.name,
    winnerName: winner.name,
    tournamentName: tournament.name,
  };
}

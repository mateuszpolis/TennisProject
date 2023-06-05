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
  const match = new Match({
    player1: req.body.player1,
    player2: req.body.player2,
    odds1: req.body.odds1,
    odds2: req.body.odds2,
    winner: winner,
    date: new Date(req.body.date),
    tournament: req.body.tournament,
  });
  console.log(match);
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

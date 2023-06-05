const express = require("express");
const router = express.Router();  
const Tournament = require("../models/tournament");

// All Tournaments Route
router.get("/", async (req, res) => {
  let searchOptions = {};
  if (req.query.name != null && req.query.name !== "") {
    searchOptions.name = new RegExp(req.query.name, "i");
  }
  if (req.query.location != null && req.query.location !== "") {
    searchOptions.location = new RegExp(req.query.location, "i");
  }
  if (req.query.tournamentRank != null && req.query.tournamentRank !== "") {
    searchOptions.tournamentRank = req.query.tournamentRank;
  }
  try {
    const tournaments = await Tournament.find(searchOptions);
    res.render("tournaments/index", { tournaments: tournaments, searchOptions: req.query });
  } catch {
    res.redirect("/");
  }
});

// New Tournament Route
router.get("/new", (req, res) => {
  res.render("tournaments/new", { tournament: new Tournament() });
});

// Create Tournament Route
router.post("/", async (req, res) => {
  const tournament = new Tournament({
    name: req.body.name,
    location: req.body.location,
    tournamentRank: req.body.tournamentRank,
  });
  try {
    const newTournament = await tournament.save();
    // res.redirect(`tournaments/${newTournament.id}`);
    res.redirect("tournaments");
  } catch {
    res.render("tournaments/new", {
      tournament: tournament,
      errorMessage: "Error creating Tournament",
    });
  }
});

module.exports = router;
const express = require("express");
const router = express.Router();
const Tournament = require("../models/tournament");
const Match = require("../models/match");

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
    const numberOfTournaments = tournaments.length;
    res.render("tournaments/index", {
      tournaments: tournaments,
      searchOptions: req.query,
      numberOfTournaments: numberOfTournaments,
    });
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

// Show Tournament Route
router.get("/:id", async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    res.render("tournaments/show", { tournament: tournament });
  } catch {
    res.redirect("/");
  }
});

// Edit Tournament Route
router.get("/:id/edit", async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    res.render("tournaments/edit", { tournament: tournament });
  } catch {
    res.redirect("/tournaments");
  }
});

// Update Tournament Route
router.put("/:id", async (req, res) => {
  let tournament;
  try {
    tournament = await Tournament.findById(req.params.id);
    tournament.name = req.body.name;
    tournament.location = req.body.location;
    tournament.tournamentRank = req.body.tournamentRank;
    await tournament.save();
    res.redirect(`/tournaments/${tournament.id}`);
  } catch {
    if (tournament == null) {
      res.redirect("/");
    } else {
      res.render("tournaments/edit", {
        tournament: tournament,
        errorMessage: "Error updating Tournament",
      });
    }
  }
});

// Delete Tournament Route
router.delete("/:id", async (req, res) => {
  let tournament;
  try {
    tournament = await Tournament.findById(req.params.id);
    const matches = await Match.find({ tournament: tournament.id });
    if (matches.length > 0) {
      console.err(
        new Error(
          "There have been matches played at this tournament. Tournament cannot be deleted."
        )
      );
    }
    await Tournament.deleteOne({ _id: req.params.id });
    res.redirect("/tournaments");
  } catch {
    if (tournament == null) {
      res.redirect("/");
    } else {
      res.redirect(`/tournaments/${tournament.id}`);
    }
  }
});

module.exports = router;

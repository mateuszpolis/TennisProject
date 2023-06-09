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
    const matches = await Match.find({})
      .populate("player1")
      .populate("player2")
      .populate("winner")
      .populate("tournament")
      .exec();

    let filteredMatches = [];
    if (searchOptions?.player1 && searchOptions?.player2) {
      for (const match of matches) {
        if (
          searchOptions.player1.test(match.player1.name) &&
          searchOptions.player2.test(match.player2.name)
        ) {
          filteredMatches.push(match);
        }
      }
    } else {
      if (searchOptions?.player1) {
        for (const match of matches) {
          if (searchOptions?.player1.test(match.player1.name)) {
            filteredMatches.push(match);
          }
        }
      } else if (searchOptions?.player2) {
        for (const match of matches) {
          if (searchOptions?.player2.test(match.player2.name)) {
            filteredMatches.push(match);
          }
        }
      } else {
        filteredMatches = matches;
      }
    }
    filteredMatches.sort((a, b) => {
      if (a.date > b.date) return -1;
      else if (a.date < b.date) return 1;
      else return 0;
    });
    res.render("matches/index", {
      matches: filteredMatches,
      searchOptions: req.query,
    });
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
    req.body.player2
  );

  for (let key in biorythms) {
    if (Math.abs(biorythms[key]) < 0.001) {
      biorythms[key] = 0;
    }
  }

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
  });
  try {
    await match.save();
    res.redirect("matches");
  } catch {
    renderNewPage(res, match, true);
  }
});

// Show Match Route
router.get("/:id", async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate("player1")
      .populate("player2")
      .populate("winner")
      .populate("tournament")
      .exec();
    res.render("matches/show", { match: match });
  } catch {
    res.redirect("/");
  }
});

// Edit Match Route
router.get("/:id/edit", async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    const players = await Player.find({});
    const tournaments = await Tournament.find({});
    res.render("matches/edit", {
      match: match,
      players: players,
      tournaments: tournaments,
    });
  } catch {
    res.redirect("/matches");
  }
});

// Update Match Route
router.put("/:id/edit", async (req, res) => {
  let match;
  try {
    match = await Match.findById(req.params.id);
    match.player1 = req.body.player1;
    match.player2 = req.body.player2;
    match.odds1 = req.body.odds1;
    match.odds2 = req.body.odds2;
    match.winner = req.body.winner;
    match.date = new Date(req.body.date);
    match.tournament = req.body.tournament;
    await match.save();
    res.redirect(`/matches/${match.id}`);
  } catch {
    if (match != null) {
      res.render("matches/show", {
        match: match,
        errorMessage: "Error Updating Match",
      });
    } else {
      res.redirect("/");
    }
  }
});

// Delete Match Route
router.delete("/:id", async (req, res) => {
  let match;
  try {
    match = await Match.findById(req.params.id);
    await Match.deleteOne({ _id: req.params.id });
    res.redirect(`/matches`);
  } catch {
    if (match != null) {
      res.redirect(`/matches/${match.id}`);
    } else {
      res.redirect("/");
    }
  }
});

module.exports = router;

async function renderNewPage(res, match, hasError = false) {
  try {
    let players = await Player.find({});
    const tournaments = await Tournament.find({});
    players.sort((a, b) => {
      if (a.name < b.name) return -1;
      else if (a.name > b.name) return 1;
      else return 0;
    });
    // ktorys z zandschlupem czy chuj wie i jeszcze zppieri norrie mial byc ruud
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

async function calculateBiorythms(date, player1, player2) {
  date = new Date(date);
  let diffTime1, diffDays1, diffTime2, diffDays2;

  player1 = await Player.findById(player1);
  player2 = await Player.findById(player2);

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
  };
}

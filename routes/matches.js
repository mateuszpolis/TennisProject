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
      .populate("predictedWinner")
      .exec();

    let filteredMatches = [];
    if (searchOptions?.player1 && searchOptions?.player2) {
      for (const match of matches) {
        if (
          (searchOptions.player1.test(match.player1.name) &&
            searchOptions.player2.test(match.player2.name)) ||
          (searchOptions.player2.test(match.player1.name) &&
            searchOptions.player1.test(match.player2.name))
        ) {
          filteredMatches.push(match);
        }
      }
    } else {
      if (searchOptions?.player1) {
        for (const match of matches) {
          if (
            searchOptions?.player1.test(match.player1.name) ||
            searchOptions?.player1.test(match.player2.name)
          ) {
            filteredMatches.push(match);
          }
        }
      } else if (searchOptions?.player2) {
        for (const match of matches) {
          if (
            searchOptions?.player2.test(match.player2.name) ||
            searchOptions?.player2.test(match.player1.name)
          ) {
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
    const numberOfMatches = filteredMatches.length;
    res.render("matches/index", {
      matches: filteredMatches,
      searchOptions: req.query,
      numberOfMatches: numberOfMatches,
    });
    // uncomment when you want to update all matches
    // updateAllMatches();
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
    result1: req.body.result1,
    result2: req.body.result2,
    winner: winner,
    date: new Date(req.body.date),
    tournament: req.body.tournament,
    biorythmPhysical1: biorythms.physical1.toPrecision(3),
    biorythmEmotional1: biorythms.emotional1.toPrecision(3),
    biorythmPhysical2: biorythms.physical2.toPrecision(3),
    biorythmEmotional2: biorythms.emotional2.toPrecision(3),
    biorythmIntelectual1: biorythms.intelectual1.toPrecision(3),
    biorythmIntelectual2: biorythms.intelectual2.toPrecision(3),
  });

  const odds = {
    odds1: match.odds1,
    odds2: match.odds2,
  };
  const prediction = await predictWinner(biorythms, odds, match.tournament);
  if (prediction === "player1") {
    match.predictedWinner = match.player1;
  } else if (prediction === "player2") {
    match.predictedWinner = match.player2;
  } else {
    match.predictedWinner = null;
  }

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
      .populate("predictedWinner")
      .exec();
    let headToHead = await Match.find({
      $or: [
        { $and: [{ player1: match.player1 }, { player2: match.player2 }] },
        { $and: [{ player1: match.player2 }, { player2: match.player1 }] },
      ],
    })
      .populate("player1")
      .populate("player2")
      .populate("tournament")
      .exec();
    headToHead.sort((a, b) => {
      if (a.date > b.date) return -1;
      else if (a.date < b.date) return 1;
      else return 0;
    });
    res.render("matches/show", { match: match, headToHead: headToHead });
  } catch {
    res.redirect("/");
  }
});

// Edit Match Route
router.get("/:id/edit", async (req, res) => {
  let match;
  try {
    match = await Match.findById(req.params.id);
    renderEditPage(res, match);
  } catch {
    res.redirect("/");
  }
});

// Update Match Route
router.put("/:id", async (req, res) => {
  let match;
  try {
    let winner;
    if (req.body.winner === "player1") {
      winner = req.body.player1;
    } else if (req.body.winner === "player2") {
      winner = req.body.player2;
    } else {
      winner = null;
    }
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

    match = await Match.findById(req.params.id);
    match.player1 = req.body.player1;
    match.player2 = req.body.player2;
    match.odds1 = req.body.odds1;
    match.odds2 = req.body.odds2;
    match.result1 = req.body.result1;
    match.result2 = req.body.result2;
    match.winner = winner;
    match.date = new Date(req.body.date);
    match.tournament = req.body.tournament;
    match.biorythmPhysical1 = biorythms.physical1.toPrecision(3);
    match.biorythmEmotional1 = biorythms.emotional1.toPrecision(3);
    match.biorythmPhysical2 = biorythms.physical2.toPrecision(3);
    match.biorythmEmotional2 = biorythms.emotional2.toPrecision(3);
    match.biorythmIntelectual1 = biorythms.intelectual1.toPrecision(3);
    match.biorythmIntelectual2 = biorythms.intelectual2.toPrecision(3);

    const biorythms2 = {
      physical1: match.biorythmPhysical1,
      physical2: match.biorythmPhysical2,
      emotional1: match.biorythmEmotional1,
      emotional2: match.biorythmEmotional2,
      intelectual1: match.biorythmIntelectual1,
      intelectual2: match.biorythmIntelectual2,
    };
    const odds = {
      odds1: match.odds1,
      odds2: match.odds2,
    };
    const prediction = await predictWinner(biorythms2, odds, match.tournament);
    if (prediction === "player1") {
      match.predictedWinner = match.player1;
    } else if (prediction === "player2") {
      match.predictedWinner = match.player2;
    } else {
      match.predictedWinner = null;
    }
    await match.save();
    res.redirect(`/matches/${match.id}`);
  } catch {
    if (match != null) {
      renderEditPage(res, match, true);
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

async function renderEditPage(res, match, hasError = false) {
  try {
    let players = await Player.find({});
    players.sort((a, b) => {
      if (a.name < b.name) return -1;
      else if (a.name > b.name) return 1;
      else return 0;
    });
    const tournaments = await Tournament.find({});
    const params = {
      players: players,
      match: match,
      tournaments: tournaments,
    };
    if (hasError) params.errorMessage = "Error Updating Match";
    res.render("matches/edit", params);
  } catch {
    res.redirect("/matches");
  }
}

async function renderNewPage(res, match, hasError = false) {
  try {
    let players = await Player.find({});
    const tournaments = await Tournament.find({});
    players.sort((a, b) => {
      if (a.name < b.name) return -1;
      else if (a.name > b.name) return 1;
      else return 0;
    });
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
    intelectual1: Math.sin((2 * Math.PI * diffDays1) / 33),
    intelectual2: Math.sin((2 * Math.PI * diffDays2) / 33),
  };
}

async function getWeights(surface, tournamentRank) {
  let weights = {
    physicalSurface: 0,
    emotionalSurface: 0,
    intelectualSurface: 0,
    physicalRank: 0,
    emotionalRank: 0,
    intelectualRank: 0,
  };
  try {
    const matches = await Match.find({})
      .populate("tournament")
      .populate("winner")
      .exec();
    for (let match of matches) {
      let winnerPhysical, winnerEmotional, winnerIntelectual;
      let loserPhysical, loserEmotional, loserIntelectual;
      if (match.winner.id === match.player1) {
        winnerPhysical = match.biorythmPhysical1;
        winnerEmotional = match.biorythmEmotional1;
        winnerIntelectual = match.biorythmIntelectual1;
        loserPhysical = match.biorythmPhysical2;
        loserEmotional = match.biorythmEmotional2;
        loserIntelectual = match.biorythmIntelectual2;
      } else {
        winnerPhysical = match.biorythmPhysical2;
        winnerEmotional = match.biorythmEmotional2;
        winnerIntelectual = match.biorythmIntelectual2;
        loserPhysical = match.biorythmPhysical1;
        loserEmotional = match.biorythmEmotional1;
        loserIntelectual = match.biorythmIntelectual1;
      }
      if (match.tournament.surface === surface) {
        if (winnerPhysical > loserPhysical) {
          weights.physicalSurface++;
        }
        if (winnerEmotional > loserEmotional) {
          weights.emotionalSurface++;
        }
        if (winnerIntelectual > loserIntelectual) {
          weights.intelectualSurface++;
        }
      }
      if (match.tournament.tournamentRank === tournamentRank) {
        if (winnerPhysical > loserPhysical) {
          weights.physicalRank++;
        }
        if (winnerEmotional > loserEmotional) {
          weights.emotionalRank++;
        }
        if (winnerIntelectual > loserIntelectual) {
          weights.intelectualRank++;
        }
      }
    }
  } catch {
    console.log("error");
  }
  return weights;
}

async function predictWinner(biorythms, odds, tournamentId) {
  const tournament = await Tournament.findById(tournamentId).exec();
  const weights = await getWeights(
    tournament.surface,
    tournament.tournamentRank
  );
  player1Average =
    ((biorythms.physical1 + 1) *
      (weights.physicalSurface + weights.physicalRank) +
      (biorythms.emotional1 + 1) *
        (weights.emotionalSurface + weights.emotionalRank) +
      (biorythms.intelectual1 + 1) *
        (weights.intelectualSurface + weights.intelectualRank)) /
    (weights.physicalSurface +
      weights.physicalRank +
      weights.emotionalSurface +
      weights.emotionalRank +
      weights.intelectualSurface +
      weights.intelectualRank);
  player2Average =
    ((biorythms.physical2 + 1) *
      (weights.physicalSurface + weights.physicalRank) +
      (biorythms.emotional2 + 1) *
        (weights.emotionalSurface + weights.emotionalRank) +
      (biorythms.intelectual2 + 1) *
        (weights.intelectualSurface + weights.intelectualRank)) /
    (weights.physicalSurface +
      weights.physicalRank +
      weights.emotionalSurface +
      weights.emotionalRank +
      weights.intelectualSurface +
      weights.intelectualRank);

  player1Adjusted = player1Average / odds.odds1;
  player2Adjusted = player2Average / odds.odds2;

  if (player1Adjusted > player2Adjusted) {
    return "player1";
  } else {
    return "player2";
  }
}

async function updateAllMatches() {
  const matches = await Match.find({});
  for (let match of matches) {
    const biorythms = await calculateBiorythms(
      match.date,
      match.player1,
      match.player2
    );
    for (let key in biorythms) {
      if (Math.abs(biorythms[key]) < 0.001) {
        biorythms[key] = 0;
      }
    }
    match.biorythmPhysical1 = biorythms.physical1.toPrecision(3);
    match.biorythmEmotional1 = biorythms.emotional1.toPrecision(3);
    match.biorythmIntelectual1 = biorythms.intelectual1.toPrecision(3);
    match.biorythmPhysical2 = biorythms.physical2.toPrecision(3);
    match.biorythmEmotional2 = biorythms.emotional2.toPrecision(3);
    match.biorythmIntelectual2 = biorythms.intelectual2.toPrecision(3);
    const odds = {
      odds1: match.odds1,
      odds2: match.odds2,
    };
    const prediction = await predictWinner(biorythms, odds, match.tournament);
    if (prediction === "player1") {
      match.predictedWinner = match.player1;
    } else if (prediction === "player2") {
      match.predictedWinner = match.player2;
    } else {
      match.predictedWinner = null;
    }
    await match.save();
  }
}

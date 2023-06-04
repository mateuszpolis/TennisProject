const express = require("express");
const router = express.Router();
const Player = require("../models/player");

// All Players Route
router.get("/", async (req, res) => {
  let searchOptions = {};
  if (req.query.name != null && req.query.name !== "") {
    searchOptions.name = new RegExp(req.query.name, "i");
  }
  if (req.query.country != null && req.query.country !== "") {
    searchOptions.country = new RegExp(req.query.country, "i");
  }
  try {
    const players = await Player.find(searchOptions);
    res.render("players/index", { players: players, searchOptions: req.query });
  } catch {
    res.redirect("/");
  }
  res.render("players/index");
});

// New Player Route
router.get("/new", (req, res) => {
  res.render("players/new", { player: new Player() });
});

// Create Player Route
router.post("/", async (req, res) => {
  const player = new Player({
    name: req.body.name,
    birthdate: req.body.birthdate,
    country: req.body.country,
  });
  try {
    const newPlayer = await player.save();
    // res.redirect(`players/${newPlayer.id}`);
    res.redirect("players");
  } catch {
    res.render("players/new", {
      player: player,
      errorMessage: "Error creating Player",
    });
  }
});

module.exports = router;

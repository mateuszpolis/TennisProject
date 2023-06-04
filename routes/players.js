const express = require("express");
const router = express.Router();
const Player = require("../models/player");

// All Players Route
router.get("/", (req, res) => {
  res.render("players/index");
});

// New Player Route
router.get("/new", (req, res) => {
  res.render("players/new", { player: new Player() });
});

// Create Player Route
router.post("/", (req, res) => {
  const player = new Player({
    name: req.body.name,
    birthdate: new Date(req.body.birthdate),
    country: req.body.country,
  });
  player
    .save()
    .then((newPlayer) => {
      // res.redirect(`players/${newPlayer.id}`);
      res.redirect(`players`);
    })
    .catch((err) => {
      res.render("players/new", {
        player: player,
        errorMessage: "Error creating Player",
      });
    });
});

module.exports = router;

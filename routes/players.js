const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Player = require("../models/player");
const Match = require("../models/match");
const uploadPath = path.join("public", Player.pictureBasePath);
const upload = multer({
  dest: uploadPath,
  fileFilter: (req, file, callback) => {
    callback(
      null,
      ["image/png", "image/jpg", "image/jpeg"].includes(file.mimetype)
    );
  },
});

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
});

// New Player Route
router.get("/new", (req, res) => {
  res.render("players/new", { player: new Player() });
});

// Create Player Route
router.post("/", upload.single("picture"), async (req, res) => {
  req.file != null ? (req.body.picture = req.file.filename) : null;
  const player = new Player({
    name: req.body.name,
    birthdate: new Date(req.body.birthdate),
    country: req.body.country,
    picture: req.body.picture,
  });
  try {
    const newPlayer = await player.save();
    res.redirect(`/players/${newPlayer.id}`);
  } catch {
    if (player.picture != null) {
      removePicture(player.picture);
    }
    res.render("players/new", {
      player: player,
      errorMessage: "Error creating Player",
    });
  }
});

// Show Player Route
router.get("/:id", async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    const matches = await Match.find({
      $or: [{ player1: player.id }, { player2: player.id }],
    })
      .populate("player1")
      .populate("player2")
      .exec();
    matches.sort((a, b) => {
      if (a.date > b.date) return -1;
      else if (a.date < b.date) return 1;
      else return 0;
    });
    res.render("players/show", { player: player, matches: matches });
  } catch {
    res.redirect("/");
  }
});

// Edit Player Route
router.get("/:id/edit", async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    res.render("players/edit", { player: player });
  } catch {
    res.redirect("/players");
  }
});

// Update Player Route
router.put("/:id", async (req, res) => {
  let player;
  try {
    player = await Player.findById(req.params.id);
    player.name = req.body.name;
    player.birthdate = new Date(req.body.birthdate);
    player.country = req.body.country;
    await player.save();
    res.redirect(`/players/${player.id}`);
  } catch {
    if (player != null) {
      res.redirect("/");
    } else {
      res.render("players/edit", {
        player: player,
        errorMessage: "Error updating Player",
      });
    }
  }
});

// Delete Player Route
router.delete("/:id", async (req, res) => {
  let player;
  try {
    player = await Player.findById(req.params.id);
    const matches = await Match.find({
      $or: [{ player1: player.id }, { player2: player.id }],
    });
    if (matches.length > 0) {
      console.err(new Error("Player has matches"));
    }
    await Player.deleteOne({ _id: req.params.id });
    res.redirect(`/players`);
  } catch {
    if (player != null) {
      res.redirect(`/players/${player.id}`);
    } else {
      res.redirect("/");
    }
  }
});

module.exports = router;

function removePicture(fileName) {
  fs.unlink(path.join(uploadPath, fileName), (err) => {
    if (err) console.error(err);
  });
}

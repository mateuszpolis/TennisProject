const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Player = require("../models/player");
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
    // res.redirect(`players/${newPlayer.id}`);
    res.redirect("players");
  } catch {
    if (player.picture != null) {
      removeBookCover(player.picture);
    }
    res.render("players/new", {
      player: player,
      errorMessage: "Error creating Player",
    });
  }
});

module.exports = router;

function removeBookCover(fileName) {
  fs.unlink(path.join(uploadPath, fileName), (err) => {
    if (err) console.error(err);
  });
}

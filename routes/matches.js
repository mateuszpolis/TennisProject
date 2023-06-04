const express = require("express");
const router = express.Router();
const Match = require("../models/match");

// All Matches Route
router.get("/", async (req, res) => {
  res.send("All Matches");
});

// New Match Route
router.get("/new", (req, res) => {
  res.render("matches/new", { match: new Match() });
});

// Create Match Route
router.post("/", async (req, res) => {
  res.send("Create Match");
});

module.exports = router;

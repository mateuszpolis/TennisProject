const mongoose = require("mongoose");
const path = require("path");
const Match = require("./match");

const pictureBasePath = "uploads/playerPictures";

const playerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  birthdate: {
    type: Date,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  picture: {
    type: String,
    default: null,
  },
});

playerSchema.virtual("picturePath").get(function () {
  if (this.picture != null) {
    return path.join("/", pictureBasePath, this.picture);
  } else {
    return "/defaults/defaultPlayerPicture.png";
  }
});

playerSchema.pre("deleteOne", async function (next) {
  let matches = {};
  try {
    console.log(this);
    matches = await Match.find({
      $or: [{ player1: this.id }, { player2: this.id }],
    });
    console.log(matches);
    if (Object.keys(matches).length > 0) {
      next(new Error("This player has matches still"));
    } else {
      next();
    }
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Player", playerSchema);
module.exports.pictureBasePath = pictureBasePath;

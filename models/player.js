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


module.exports = mongoose.model("Player", playerSchema);
module.exports.pictureBasePath = pictureBasePath;

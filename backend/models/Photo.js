const mongoose = require("mongoose");

const photoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "",
    },

    caption: {
      type: String,
      default: "",
    },

    tag: {
      type: String,
      default: "cute",
    },

    sticker: {
      type: String,
      default: "🌸",
    },

    url: {
      type: String,
      required: true,
    },

    thumbnailUrl: {
      type: String,
      default: "",
    },

    public_id: {
      type: String,
      required: true,
    },

    isFavorite: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Photo", photoSchema);
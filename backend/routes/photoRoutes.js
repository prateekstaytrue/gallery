const express = require("express");
const multer = require("multer");

const {
  getPhotos,
  uploadPhotos,
  updatePhoto,
  deletePhoto,
} = require("../controllers/photoController");

const router = express.Router();


// TEMP local upload storage
const upload = multer({
  dest: "uploads/",
});


// ROUTES
router.get("/", getPhotos);

router.post(
  "/upload",
  upload.array("files"),
  uploadPhotos
);

router.patch("/:id", updatePhoto);

router.delete("/:id", deletePhoto);


module.exports = router;
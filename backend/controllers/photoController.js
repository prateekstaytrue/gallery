const cloudinary = require("../config/cloudinary");
const Photo = require("../models/Photo");


// GET ALL PHOTOS
const getPhotos = async (req, res) => {
  try {
    const photos = await Photo.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      photos,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// UPLOAD PHOTO
const uploadPhotos = async (req, res) => {
  try {
    const files = req.files;

    if (!files || !files.length) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      });
    }

    const titles = req.body.titles || [];
    const captions = req.body.captions || [];
    const tags = req.body.tags || [];
    const stickers = req.body.stickers || [];

    const uploadedPhotos = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Upload to cloudinary
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "gallery-app",
      });

      // Save in MongoDB
      const photo = await Photo.create({
        title: titles[i] || "",
        caption: captions[i] || "",
        tag: tags[i] || "cute",
        sticker: stickers[i] || "🌸",

        url: result.secure_url,

        thumbnailUrl: result.secure_url,

        public_id: result.public_id,
      });

      uploadedPhotos.push(photo);
    }

    res.status(201).json({
      success: true,
      photos: uploadedPhotos,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// UPDATE PHOTO
const updatePhoto = async (req, res) => {
  try {
    const updatedPhoto = await Photo.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({
      success: true,
      photo: updatedPhoto,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// DELETE PHOTO
const deletePhoto = async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);

    if (!photo) {
      return res.status(404).json({
        success: false,
        message: "Photo not found",
      });
    }

    // delete from cloudinary
    await cloudinary.uploader.destroy(photo.public_id);

    // delete from mongodb
    await Photo.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Photo deleted 💔",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


module.exports = {
  getPhotos,
  uploadPhotos,
  updatePhoto,
  deletePhoto,
};
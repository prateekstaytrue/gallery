require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

const photoRoutes = require("./routes/photoRoutes");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use("/api/photos", photoRoutes);

app.get("/", (req, res) => {
  res.send("Gallery API Running 🌸");
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} ✨`);
});
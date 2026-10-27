const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const communityRoutes = require("./routes/community");
const chatRoutes = require("./routes/chat");
const reportRoutes = require("./routes/report");
const stressRoutes = require("./routes/stress");
const moodRoutes = require("./routes/mood");
const characterRoutes = require("./routes/character");
const meRoutes = require("./routes/me");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/stress", stressRoutes);
app.use("/api/moods", moodRoutes);
app.use("/api/character", characterRoutes);
app.use("/api/me", meRoutes);

app.get("/", (req, res) => {
  res.send("Node.js Supabase server is running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, process.env.HOST || '127.0.0.1', () => {
  console.log(`Server running on port ${PORT}`);
});

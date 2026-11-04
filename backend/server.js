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
const healthRoutes = require("./routes/health");
const { startDailyStressScheduler } = require("./jobs/dailyStressScheduler");

const app = express();

app.use(cors());
// 건강 기록은 며칠 치 심박수를 한 번에 보내므로 기본 한도(100kb)보다 넉넉하게 받는다.
app.use(express.json({ limit: "5mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/stress", stressRoutes);
app.use("/api/moods", moodRoutes);
app.use("/api/character", characterRoutes);
app.use("/api/me", meRoutes);
app.use("/api/health", healthRoutes);

app.get("/", (req, res) => {
  res.send("Node.js Supabase server is running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startDailyStressScheduler();
});
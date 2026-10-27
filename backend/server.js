const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const communityRoutes = require("./routes/community");
const chatRoutes = require("./routes/chat");
const reportRoutes = require("./routes/report");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/reports", reportRoutes);

app.get("/", (req, res) => {
  res.send("Node.js Supabase server is running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
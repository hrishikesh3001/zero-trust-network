const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const vaultRoutes = require("./routes/vault");
const dashboardRoutes = require("./routes/dashboard");

const app = express();

// Security headers on every response
app.use(helmet());

// Only allow requests from your React front-end
app.use(
  cors({
    origin: "*",
    credentials: false,
  }),
);

// Parse JSON request bodies
app.use(express.json());

// Request logger — logs every incoming request
app.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.path} from ${req.ip}`,
  );
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/vault", vaultRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;

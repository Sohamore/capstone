import express    from "express";
import mongoose   from "mongoose";
import cors       from "cors";
import dotenv     from "dotenv";
import userRoutes    from "./routes/users.js";
import orderRoutes   from "./routes/orders.js";
import productRoutes from "./routes/products.js";

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── CORS ─────────────────────────────────────────────────────────────────────
// In production (Vercel), the frontend and backend share the same domain,
// so we allow all origins. In dev, we restrict to localhost only.
const devOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (Postman, mobile, curl)
    if (!origin) return cb(null, true);
    // Allow all Vercel deployments (*.vercel.app) and any custom domain set in FRONTEND_URL
    if (
      origin.endsWith(".vercel.app") ||
      origin === process.env.FRONTEND_URL ||
      devOrigins.includes(origin)
    ) return cb(null, true);
    return cb(null, false);
  },
  credentials: true,
}));

app.use(express.json());

// ─── MongoDB ──────────────────────────────────────────────────────────────────
if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB connected successfully"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));
} else {
  console.warn("⚠️ MONGO_URI not set — database routes will fail.");
}

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/users",    userRoutes);
app.use("/api/orders",   orderRoutes);
app.use("/api/products", productRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "ShriKrishna SteelWorks API is running ✅" });
});

// ─── Start server ─────────────────────────────────────────────────────────────
// Render (and local dev) both need app.listen() to bind a port.
// Render sets NODE_ENV=production but still requires a running HTTP server.
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
}).on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} already in use.`);
  } else {
    console.error(err);
  }
  process.exit(1);
});

export default app;

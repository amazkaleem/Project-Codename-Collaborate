import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { sql } from "./config/db.js";
import { validate as isUuid } from "uuid";
import transactionRoutes from "./routes/transactionRoutes.js";
import rateLimiter from "./middleware/rateLimiter.js";
import cleanClerkIdMiddleware from "./middleware/cleanClerkIdMiddleware.js";

dotenv.config();

const app = express();

//MiddleWare

const PORT = process.env.PORT || 8081;
const origin = process.env.EXPO_PUBLIC_API_BASE_URL;

app.use(
  cors({
    origin: { origin }, // In production, replace with your specific domains
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(cleanClerkIdMiddleware);
app.use(rateLimiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Server 'Health Check'
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Mount router under /api (replace the incomplete app.use("/api") later in the file)
app.use("/api", transactionRoutes);

app.listen(PORT, () => {
  console.log(`Server is running at PORT number ${PORT}`);
});

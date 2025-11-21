import express from "express";
import dotenv from "dotenv";
import { sql } from "./config/db.js";
import { validate as isUuid } from "uuid";
import transactionRoutes from "./routes/transactionRoutes.js";
import rateLimiter from "./middleware/rateLimiter.js";

dotenv.config();

const app = express();

//MiddleWare
app.use(rateLimiter);
app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 8081;

//Server 'Health Check'
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Mount router under /api (replace the incomplete app.use("/api") later in the file)
app.use("/api", transactionRoutes);

app.listen(PORT, () => {
  console.log(`Server is running at PORT number ${PORT}`);
});

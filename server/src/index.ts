import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { api } from "./routes/index.js";

const app = express();
app.use(cors());
app.use(express.json());
app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api", api);
app.listen(config.port, () => console.log(`MandatePay server on :${config.port}`));

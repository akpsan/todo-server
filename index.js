import express from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";
import dotenv from "dotenv";
import router from "./routes.js";
dotenv.config();

const mongoDB = process.env.MONGO_DB_URL;

mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));

const app = express();
const port = 3002;

app.use(morgan("dev"));
app.use(express.json());
app.use(cors());
app.use("/", router);

app.listen(port, () => {
  console.log(`Todo app listening at http://localhost:${port}`);
});

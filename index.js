import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const server = express();
server.use(cors());
server.use(express.json());
const port = 5000;
const mongoClient = new MongoClient(process.env.MONGO_URI);

let db;
mongoClient.connect().then(() => {
  db = mongoClient.db("test");
});

server.post("/participants", (req, res) => {
  const { name } = req.body;

  if (!name || typeof name !== "string") {
    res.sendStatus(422);
    return
  }

  res.sendStatus(201);
});

server.get("/participants", (req, res) => {
  db.collection("dataUOL")
    .find()
    .toArray()
    .then((response) => {
      res.send(response);
    });
});

server.listen(port, () => console.log(`Listening on port ${port}`));

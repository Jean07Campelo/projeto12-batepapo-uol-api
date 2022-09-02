import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import joi from "joi";
import dotenv from "dotenv";
dotenv.config();

const userSchema = joi.object({
  name: joi.string().required(),
});

const server = express();
server.use(cors());
server.use(express.json());
const port = 5000;
const mongoClient = new MongoClient(process.env.MONGO_URI);

let db;
mongoClient.connect().then(() => {
  db = mongoClient.db("test");
});

server.post("/participants", async (req, res) => {
  const { name } = req.body;

  //valida usuario com lib joi:
  const validationName = userSchema.validate(req.body, { abortEarly: true });

  if (validationName.error) {
    const errors = validationName.error.details.map(detail => detail.message);
    res.status(400).send(errors);
    return;
  }

  try {
    const dataUsers = await db.collection("uol_participants").find().toArray();
    const nameExisting = dataUsers.find((user) => user.name === name);

    //valida usuário existente:
    if (nameExisting) return res.send(409);

    //salva participante no banco:
    db.collection("uol_participants").insertOne({
      name: name,
      lastStatus: Date.now(),
    });
  } catch (error) {
    console.log(error);
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

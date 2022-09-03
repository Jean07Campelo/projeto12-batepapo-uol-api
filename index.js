import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import joi from "joi";
import dayjs from "dayjs";
import dotenv from "dotenv";
dotenv.config();

const userSchema = joi.object({
  name: joi.string().required(),
});

const messageSchema = joi.object({
  to: joi.string().required(),
  text: joi.string().required(),
  type: joi.string().required().valid("message").valid("private_message"),
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
  const validationName = userSchema.validate(req.body, { abortEarly: false });

  if (validationName.error) {
    const errors = validationName.error.details.map((detail) => detail.message);
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

    //salvando status participante
    const time = dayjs(Date.now()).format("HH:mm:ss");
    db.collection("uol_status").insertOne({
      from: name,
      to: "Todos",
      text: "entra na sala...",
      type: "status",
      time: time,
    });
  } catch (error) {
    console.log(error);
  }

  res.sendStatus(201);
});

server.get("/participants", async (req, res) => {
  try {
    const participants = await db.collection("uol_participants").find().toArray();
    res.send(participants);
  } catch (error) {
    res.status(500);
  }
});

server.post("/messages", async (req, res) => {
  const { to, text, type } = req.body;
  const from = req.headers.user;

  //valida usuario FROM
  try {
    const userExisting = await db
      .collection("uol_participants")
      .find({ name: from });

    if (!userExisting) {
      res.send({ error: "user não está na sala" });
    }
  } catch (error) {
    res.sendStatus(500);
  }

  //valida campos da mensagem
  const validateMessage = messageSchema.validate(req.body, {
    abortEarly: false,
  });
  if (validateMessage.error) {
    const errors = validateMessage.error.details.map(
      (detail) => detail.message
    );
    res.status(422).send(errors);
    return;
  }

  //salvando mensagem no banco
  const time = dayjs(Date.now()).format("HH:mm:ss");
  db.collection("uol_messages").insertOne({
    to,
    text,
    type,
    from,
    time,
  });

  res.sendStatus(201);
});

server.listen(port, () => console.log(`Listening on port ${port}`));

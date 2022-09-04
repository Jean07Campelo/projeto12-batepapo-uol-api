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

  return res.sendStatus(201);
});

server.get("/participants", async (req, res) => {
  try {
    const participants = await db
      .collection("uol_participants")
      .find()
      .toArray();
    return res.send(participants);
  } catch (error) {
    return res.status(500);
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
      return res.send({ error: "usuário não está na sala" });
    }
  } catch (error) {
    return res.sendStatus(500);
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

  return res.sendStatus(201);
});

server.get("/messages", async (req, res) => {
  const limit = req.query.limit;
  const userRequest = req.headers.user;

  //retornando mensagens filtradas
  try {
    const messages = await db.collection("uol_messages").find().toArray();
    const messagesFilter = messages.filter(
      (message) =>
        message.from === userRequest ||
        message.type === "message" ||
        message.to === userRequest
    );

    //aplicando limite de mensagens
    limit ? res.send(messagesFilter.slice(-limit)) : res.send(messagesFilter);
  } catch (error) {
    return res.sendStatus(500);
  }
});

server.post("/status", async (req, res) => {
  const { user } = req.headers;

  try {
    const userPresent = await db
      .collection("uol_participants")
      .findOne({ name: user });

    if (userPresent) {
      //atualiza status
      await db
        .collection("uol_participants")
        .updateOne({ name: user }, { $set: { lastStatus: Date.now() } });
      return res.sendStatus(200);
    } else {
      return res.sendStatus(404);
    }
  } catch (error) {
    return res.sendStatus(500);
  }
});

setInterval(async () => {
  try {
    const participants = await db
      .collection("uol_participants")
      .find()
      .toArray();
    participants.map((item) => validate(item));
  } catch (error) {
    res.sendStatus(500);
  }

  //valida tempo do usuário na sala
  async function validate(user) {
    const timeNow = Date.now();
    if (timeNow - user.lastStatus <= 10000) {
      await db.collection("uol_participants").deleteOne({ name: user.name });
      //salvando status de saida
      const time = dayjs(timeNow).format("HH:mm:ss");
      db.collection("uol_messages").insertOne({
        from: user.name,
        to: "Todos",
        text: "sai da sala...",
        type: "status",
        time: time,
      });
    }
  }
}, 15000);


server.listen(port, () => console.log(`Listening on port ${port}`));

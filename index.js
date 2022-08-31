import express from "express";
import cors from "cors";

const server = express();
server.use(cors());
server.use(express.json());
const port = 5000;

const users = [
  { name: "nameTest1" },
  { name: "nameTest2" },
  { name: "corvus" },
];
server.post("/participants", (req, res) => {
  const { name } = req.body;

  if (!name || typeof name !== "string") {
    res.status(422);
  } 

  const nameExisting = users.find((user) => user.name === name);
  if (nameExisting) {
    res.status(409).send({ error: "Nome de usuário já cadastrado" });
  }

  res.status(201);
});

server.listen(port, () => console.log(`Listening on port ${port}`));

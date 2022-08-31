import express from 'express';
import cors from 'cors';

const server = express();
server.use(cors());
server.use(express.json());
const port = 5000;


server.post('/participants', (req, res) => {
    const { name } = req.body;
    
    if (!name || typeof(name) !== 'string') {
        return res.send(422);
    }
    res.send(201);
})


server.listen(port, () => console.log(`Listening on port ${port}`));
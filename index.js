import express from 'express';
import cors from 'cors';

const server = express();
server.use(cors());
server.use(express.json());
const port = 5000;


server.post('/participants', (req, res) => {
    
    
})


server.listen(port, () => console.log(`Listening on port ${port}`));
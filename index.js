require('dotenv').config();
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
let num = 5;


const port = process.env.PORT || 4001;
const index = require("./routes/index");


const app = express();
app.use(index);


const server = http.createServer(app);

const path = require('path');
app.use(express.static(path.join(__dirname, 'build')));



  const io = require("socket.io")(server, {
    cors: {
      origin: 'http://localhost:3000:*https://romantic-fermat-9b4827.netlify.app/:*',
      methods: ["GET", "POST"]
    }
  });
 


io.on("connection", (socket) => {
  socket.on('move', (move) => {
    console.log(num);
    num++;
    io.emit("game" + move.game, move);
  })
})



const { client } = require('./db');

server.listen(port, async () => {
  try{
    await client.connect();
    console.log(`Database is running`);
  }catch(error){
    console.error("Database is closed for repairs!\n", error);
  }
  console.log(`Listening on port ${port}`);

});


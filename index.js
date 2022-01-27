require('dotenv').config();
const express = require("express");
const http = require("http");


const port = process.env.PORT || 4001;
const index = require("./routes/index");

const app = express();
app.use(index);


const server = http.createServer(app);

// const io = require("socket.io")(server, {
//     cors: {
//       origin: port,
//       methods: ["GET", "POST"]
//     }
//   });

const io = server;



io.on("connection", (socket) => {
  socket.on('move', (move) => {
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
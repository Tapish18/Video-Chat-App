const express = require("express");
const socket = require("socket.io");
const http = require("http");
const PORT = 4000;

let count = 0;

const app = express();
const httpServer = http.createServer(app);
app.use(express.static("public"));

const io = socket(httpServer);

io.on("connection", (socket) => {
  console.log("user connected : ", socket.id);
  socket.on("joinRoom", (roomId) => {
    let rooms = io.sockets.adapter.rooms;
    console.log(rooms);
    const room = rooms.get(roomId);
    if (room == undefined) {
      socket.join(roomId);
      socket.emit("created");
    } else if (room.size == 1) {
      socket.join(roomId);
      socket.emit("joined");
      // socket.broadcast.to(roomId).emit("ready");
      socket.broadcast.to(roomId).emit("peerJoined");
    } else {
      socket.emit("full");
    }
    console.log(io.sockets.adapter.rooms);
  });

  socket.on("ready", (roomId) => {
    socket.broadcast.to(roomId).emit("ready");
  });

  socket.on("candidate", (candidate, roomId) => {
    // console.log("candidate", candidate);
    count += 1;
    console.log("Trying to broadcast candidate : ", count);
    socket.broadcast.to(roomId).emit("candidate", candidate);
  });
  socket.on("offer", (offer, roomId) => {
    // console.log("offer", offer);
    socket.broadcast.to(roomId).emit("offer", offer);
  });
  socket.on("answer", (answer, roomId) => {
    socket.broadcast.to(roomId).emit("answer", answer);
  });
  socket.on("leave", (roomId) => {
    socket.leave(roomId);
    socket.broadcast.to(roomId).emit("leave");
  });
});

httpServer.listen(PORT, () => {
  console.log("Server Started Successfully at Port : ", PORT);
});

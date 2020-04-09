const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const {
  getCurrentUser,
  userJoin,
  getRoomUsers,
  userLeave,
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const botname = "Chat cord bot ";

//Set static folder

app.use(express.static(path.join(__dirname, "public")));

// Run when a client conntects
io.on("connection", (socket) => {
  //   console.log("New web socket connection");

  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // Welcome current user
    socket.emit("message", formatMessage(botname, "Welcome to chatcord"));

    // Prodcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botname, `A ${user.username} has joined the cha`)
      );
    const roomusers = getRoomUsers(user.room);

    // Send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  // Runs when client disconnects

  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botname, `${user.username}  has left the chat`)
      );
      // Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
  // Listen for chat msgs

  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });
});

const port = 3000 || process.env.port;
server.listen(port, () => {
  console.log("Server is runnning", port);
});

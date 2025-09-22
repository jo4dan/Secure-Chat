// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Serve frontend
app.use(express.static(path.join(__dirname, "static")));
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "static", "index.html"));
});

// Users map: { username: { socketId, pubkey } }
let users = {};

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("register", (data) => {
        users[data.user] = { socketId: socket.id, pubkey: data.pubkey };
        console.log(`Registered user: ${data.user}`);
    });

    socket.on("get_pubkey", (data) => {
        let friend = users[data.friend];
        if (friend) {
            io.to(socket.id).emit("pubkey", { pubkey: friend.pubkey });
        } else {
            io.to(socket.id).emit("pubkey", { error: "Friend not found" });
        }
    });

    socket.on("send_message", (data) => {
        socket.broadcast.emit("receive_message", data);
    });

    socket.on("disconnect", () => {
        for (let u in users) {
            if (users[u].socketId === socket.id) {
                console.log(`User disconnected: ${u}`);
                delete users[u];
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

// server.js - Real-time music sync server

// Zaroori libraries ko import karein
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require("socket.io");

// Express app aur HTTP server banayein
const app = express();
const server = http.createServer(app);

// Socket.IO ko server se jodein
const io = new Server(server);

// Public folder ko static files (HTML, CSS, JS) ke liye set karein
app.use(express.static(path.join(__dirname, 'public')));

// Client ko index.html file bhej dein
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Socket.IO connection handle karein
io.on('connection', (socket) => {
    console.log(`Ek naya user connect hua: ${socket.id}`);

    // Room banayein
    socket.on('create-room', (roomId) => {
        socket.join(roomId);
        console.log(`Admin ${socket.id} ne room ${roomId} banaya.`);
        io.to(roomId).emit('room-update', { roomId, message: 'Naya room banaya gaya hai. Users ab join kar sakte hain.' });
    });

    // Room join karein
    socket.on('join-room', (roomId) => {
        // Check karein ki room exist karta hai ya nahi
        if (io.sockets.adapter.rooms.has(roomId)) {
            socket.join(roomId);
            console.log(`User ${socket.id} ne room ${roomId} join kiya.`);
            io.to(roomId).emit('room-update', { roomId, message: `Ek naya user ${socket.id} ne room join kiya.` });
        } else {
            console.log(`Room ${roomId} exist nahi karta.`);
            // User ko private message bhejein
            socket.emit('room-update', { message: 'Yeh room ID exist nahi karta. Kripya sahi ID daalein.' });
        }
    });

    // Music chalane ya rokne ka event
    socket.on('play-music', (data) => {
        console.log(`Room ${data.roomId} mein play event aaya.`);
        // Admin ke alawa sabhi users ko sync-music event bhejein
        socket.to(data.roomId).emit('sync-music', { action: 'play', time: data.time });
    });

    // Music rokne ka event
    socket.on('pause-music', (data) => {
        console.log(`Room ${data.roomId} mein pause event aaya.`);
        // Admin ke alawa sabhi users ko sync-music event bhejein
        socket.to(data.roomId).emit('sync-music', { action: 'pause', time: data.time });
    });

    // Disconnect hone par
    socket.on('disconnect', () => {
        console.log(`Ek user disconnect ho gaya: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server http://localhost:${PORT} par chal raha hai.`);
});

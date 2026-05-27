import {Server} from "socket.io";
import express from "express";
import http from "http";

const app = express();

const server = http.createServer(app);

const allowedOrigins = process.env.URL
    ? process.env.URL.split(",").map((o) => o.trim())
    : [];

const io = new Server(server,{
    cors:{
        origin: allowedOrigins,
        methods:['GET','POST'],
        credentials: true
    }
})

const userSocketMap = {};

export const getReceiverSocketId = (receiverId) => userSocketMap[receiverId];

io.on('connection',(socket) => {
    const userId = socket.handshake.query.userId;
    if(userId) {
        userSocketMap[userId] = socket.id;
        console.log(`User connected: UserId = ${userId}, SocketId = ${socket.id}`);
    }
    io.emit('getOnlineUsers',Object.keys(userSocketMap));

    socket.on('disconnect',()=>{
        if(userId){
            console.log(`User connected: UserId = ${userId}, SocketId = ${socket.id}`);
            delete userSocketMap[userId];
        }
        io.emit('getOnlineUsers',Object.keys(userSocketMap));
    });
} )

export {app,server,io};

# Socket.IO Related Functions and Code Blocks

Below are the functions and code blocks related to Socket.io usage across the project, including their file references.

### 1. Server-side Socket Setup
**File:** [server/socket/socket.js](file:///Users/kunalyadav/Documents/Projects/Astra/server/socket/socket.js)

```javascript
import {Server} from "socket.io";
import express from "express";
import http from "http";

const app = express();
const server = http.createServer(app);

const allowedOrigins = process.env.URL
    ? process.env.URL.split(",").map((o) => o.trim())
    : [];

const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            if (origin.endsWith(".vercel.app")) return callback(null, true);
            if (allowedOrigins.includes(origin)) return callback(null, true);
            callback(new Error("Not allowed by CORS"));
        },
        methods: ['GET', 'POST'],
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
```

### 2. Server-side Real-time Messaging
**File:** [server/controllers/message.controller.js](file:///Users/kunalyadav/Documents/Projects/Astra/server/controllers/message.controller.js)

```javascript
import { getReceiverSocketId, io } from "../socket/socket.js";

// Inside sendMessage function
// TODO: implement socket.io here for real-time delivery
const receiverSocketId = getReceiverSocketId(receiverId);
if (receiverSocketId) {
  io.to(receiverSocketId).emit("newMessage", newMessage);
}
```

### 3. Server-side Real-time Notifications
**File:** [server/controllers/post.controller.js](file:///Users/kunalyadav/Documents/Projects/Astra/server/controllers/post.controller.js)

```javascript
import { getReceiverSocketId, io } from "../socket/socket.js";

// Inside likePost function
// implement socket io for real time notification
const user = await User.findById(likeKrneWalaUserKiId).select(
  "username profilePicture",
);
const postOwnerId = post.author.toString();
if (postOwnerId !== likeKrneWalaUserKiId) {
  const notification = {
    type: "like",
    userId: likeKrneWalaUserKiId,
    userDetails: user,
    postId,
    message: "Your post was liked",
  };
  const postOwnerSocketId = getReceiverSocketId(postOwnerId);
  io.to(postOwnerSocketId).emit("notification", notification);
}

// Inside dislikePost function
// implement socket io for real time notification
const user = await User.findById(likeKrneWalaUserKiId).select(
  "username profilePicture",
);
const postOwnerId = post.author.toString();
if (postOwnerId !== likeKrneWalaUserKiId) {
  const notification = {
    type: "dislike",
    userId: likeKrneWalaUserKiId,
    userDetails: user,
    postId,
    message: "Your post was disliked",
  };
  const postOwnerSocketId = getReceiverSocketId(postOwnerId);
  io.to(postOwnerSocketId).emit("notification", notification);
}
```

### 4. Client-side Socket Initialization and Event Listeners
**File:** [client/src/App.jsx](file:///Users/kunalyadav/Documents/Projects/Astra/client/src/App.jsx)

```javascript
import { io } from "socket.io-client";
// ...

  useEffect(() => {
    if (user) {
      const socketio = io(BASE_URL, {
        query: { userId: user?._id },
        transports: ["websocket"],
      });
      dispatch(setSocket(socketio));

      socketio.on("getOnlineUsers", (onlineUsers) => {
        dispatch(setOnlineUsers(onlineUsers));
      });

      socketio.on("notification", (notification) => {
        dispatch(setLikeNotification(notification));
      });

      return () => {
        socketio.close();
        dispatch(setSocket(null));
      };
    } else {
      dispatch(setSocket(null));
    }
  }, [user]);
```

### 5. Client-side Real-time Message Listener (Hook)
**File:** [client/src/hooks/useGetRTM.jsx](file:///Users/kunalyadav/Documents/Projects/Astra/client/src/hooks/useGetRTM.jsx)

```javascript
import { setMessages } from "../redux/chatSlice.js";
import { useEffect } from "react";
import { useDispatch,useSelector } from "react-redux";

const useGetRTM = () => {
    const dispatch = useDispatch();
    const { socket } = useSelector(store => store.socketio);
    const { messages } = useSelector(store => store.chat);

    useEffect(() => {
        socket?.on('newMessage', (newMessage) => {
            dispatch(setMessages([...(messages || []), newMessage]));
        });

        return () => {
            socket?.off("newMessage");
        };
    }, [socket, messages]);
};
export default useGetRTM;
```

### 6. Client-side Redux Slice for Socket
**File:** [client/src/redux/socketSlice.js](file:///Users/kunalyadav/Documents/Projects/Astra/client/src/redux/socketSlice.js)

```javascript
import { createSlice } from "@reduxjs/toolkit";

const socketSlice = createSlice({
    name:"socketio",
    initialState:{
        socket:null
    },
    reducers:{
        setSocket:(state,action) => {
            state.socket = action.payload;
        }
    }
});

export const {setSocket} = socketSlice.actions;
export default socketSlice.reducer;
```

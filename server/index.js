import express, { urlencoded } from "express";
import cors from "cors";
import cookieparser from "cookie-parser";
import dotenv from "dotenv";
import connectDB from "./utils/db.js";
import userRoute from "./routes/user.routes.js";
import postRoute from "./routes/post.route.js";
import messageRoute from "./routes/message.route.js";
import authRoute from "./routes/auth.routes.js";
import { app, server } from "./socket/socket.js";
import path from "path";
import mongoSanitize from "express-mongo-sanitize";

dotenv.config({ path: ".env" });

const PORT = process.env.PORT || 3600;

const _dirname = path.resolve();



app.use(express.json());
app.use(cookieparser());
app.use(urlencoded({ extended: true }));  //urlenocoed helps the server understand data sent from HTML forms.
app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.params) mongoSanitize.sanitize(req.params);
  if (req.headers) mongoSanitize.sanitize(req.headers);
  next();
});

const allowedOrigins = process.env.URL
  ? process.env.URL.split(",").map((o) => o.trim())
  : [];

const corsOptions = {
  origin: (origin, callback) => {
    // allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // allow any vercel.app subdomain (covers preview + production deployments)
    if (origin.endsWith(".vercel.app")) return callback(null, true);
    // allow explicitly listed origins from env
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // allow localhost for local development
    if (origin.startsWith("http://localhost:")) return callback(null, true);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};
app.use(cors(corsOptions));

app.use("/api/user", userRoute);
app.use("/api/post", postRoute);
app.use("/api/message", messageRoute);
app.use("/api/auth", authRoute);

app.use(express.static(path.join(_dirname,"/client/dist")));

app.use((req, res) => {
  res.sendFile(path.resolve(_dirname, "client", "dist", "index.html"));
});

server.listen(PORT, async () => {
  await connectDB();
  console.log(`server is running on the port: ${PORT}`);
});

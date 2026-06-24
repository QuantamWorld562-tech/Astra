# Astra — Project Description

> Use this file to write your project description on LinkedIn, resume, GitHub bio, or portfolio.

---

## One-Line Description

> **Astra** is a full-stack Instagram-inspired social media platform with real-time messaging, live notifications, infinite-scroll feed, and secure JWT authentication — built with React, Node.js, MongoDB, and Socket.IO.

---

## Short Paragraph (LinkedIn / Portfolio bio)

Astra is a production-grade social media web app inspired by Instagram, built entirely from scratch. Users can sign up, create image posts, follow others, like and comment in real time, and chat with live typing indicators and read receipts. The platform features cursor-based infinite scroll on the feed, skeleton loading screens, real-time Socket.IO notifications for likes, comments, and follows, and a fully functional 1:1 chat with image sharing. On the backend, security is hardened with access/refresh JWT tokens, NoSQL injection protection, and rate limiting on auth endpoints. Deployed on Render (backend) and Vercel (frontend).

---

## Bullet Points (Resume / GitHub)

- Built a full-stack social media platform (React 19, Node.js, Express 5, MongoDB, Socket.IO) inspired by Instagram
- Implemented **real-time 1:1 chat** with typing indicators, read receipts, and image sharing via Socket.IO and Cloudinary
- Designed **cursor-based infinite scroll** feed — eliminates full database fetches; scales to millions of posts
- Integrated **live notification system** for likes, comments, and follows using Socket.IO event emission
- Secured API with **access + refresh token rotation** (15-min / 7-day JWT), bcrypt hashing, rate limiting, and NoSQL injection protection
- Applied **performance best practices** — skeleton loaders, image lazy loading, debounced follow handler, error boundaries around lazy-loaded routes
- Built **post options system** (Copy Link, native Share API, Report with modal + backend storage)
- Enforced **correct HTTP semantics** — 400 for validation, 401 for auth, 403 for forbidden, 409 for conflict
- Deployed with CI/CD: Render (Node.js API) + Vercel (Vite/React), supporting cross-origin secure cookies

---

## Tech Stack (Table)

| Category | Technology |
|---|---|
| Frontend | React 19, Vite, React Router v7 |
| State | Redux Toolkit, Redux Persist |
| Real-time | Socket.IO |
| Backend | Node.js, Express.js 5 |
| Database | MongoDB, Mongoose |
| Auth | JWT (Access + Refresh tokens), bcrypt |
| Storage | Cloudinary, Multer, Sharp |
| Security | express-rate-limit, express-mongo-sanitize |
| Deployment | Vercel + Render |

---

## Key Technical Highlights (for interviews)

1. **Cursor-based pagination** using MongoDB `_id` comparisons (`$lt`) — more efficient than `skip/limit` because it uses the existing B-tree index without scanning skipped documents.

2. **Refresh token rotation** — short-lived access tokens (15 min) prevent long-lived token leaks. Refresh tokens are stored hashed in the DB and rotated on each use.

3. **Socket.IO event architecture** — a `userSocketMap` on the server maps `userId` → `socketId` for targeted real-time delivery. Events: `notification`, `typing`, `stopTyping`, `newMessage`, `messagesRead`, `getOnlineUsers`.

4. **NoSQL injection fix** — `express-mongo-sanitize` is applied manually to `req.body`, `req.params`, and `req.headers` (bypassing `req.query` reassignment which breaks on Express 5's getter-only property).

5. **Error Boundary pattern** — React class component wraps every lazy-loaded route so a crash in one component never white-screens the entire app.

---

## GitHub / Portfolio Description (short)

> Full-stack social media platform — real-time chat, live notifications, infinite scroll, image posts, JWT auth with token rotation. React · Node.js · MongoDB · Socket.IO

---

## Links

- **Live App:** https://astra-link.vercel.app
- **Backend API:** https://astra-yapg.onrender.com
- **GitHub:** *(add your repo link here)*

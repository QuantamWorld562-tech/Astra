# Astra — Full-Stack Social Media Platform

A full-featured Instagram-inspired social media app built with React, Node.js, MongoDB, and Socket.IO. Supports real-time messaging, live notifications, infinite-scroll feed, image posts, follow/unfollow, bookmarks, and an explore feed — deployed across Vercel (frontend) and Render (backend).

**Live Demo:** [https://astra-link.vercel.app](https://astra-link.vercel.app)  
**Backend API:** [https://astra-yapg.onrender.com](https://astra-yapg.onrender.com)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, React Router v7 |
| State Management | Redux Toolkit, Redux Persist |
| Real-time | Socket.IO (client + server) |
| Backend | Node.js, Express.js 5 (ESM) |
| Database | MongoDB, Mongoose |
| Auth | JWT Access + Refresh tokens (httpOnly cookies), bcrypt |
| Image Storage | Cloudinary, Multer, Sharp |
| Security | express-mongo-sanitize (NoSQL injection), express-rate-limit |
| Deployment | Vercel (frontend), Render (backend) |
| Animations | Framer Motion, Three.js, OGL |

---

## Features

### Authentication
- Register and login with email + password
- Passwords hashed with bcrypt (salt rounds: 10)
- **Access + Refresh token system** — access token expires in 15 min; refresh token (7 days) stored in httpOnly cookie
- Auth state persisted across page refreshes via `redux-persist`
- Protected routes on both client and server
- **Rate limiting** on auth endpoints (10 attempts / 15 min window)
- **NoSQL injection protection** via express-mongo-sanitize

### Posts & Feed
- Create posts with image upload (required) and optional caption
- Images auto-resized to 800×800 JPEG at 80% quality via Sharp before Cloudinary upload
- **Infinite scroll feed** — cursor-based pagination (10 posts per page), no full database fetch
- **Skeleton loaders** displayed while feed is loading (instead of spinners)
- **Image lazy loading** — images below the fold load only when scrolled to
- Like / dislike posts with optimistic UI updates + real-time notifications
- Comment on posts via a modal popup + real-time comment notifications
- Bookmark / unbookmark posts with live icon toggle
- Delete your own posts (cascades to comments)
- Author hover card with mini profile stats and last 3 posts
- **Post options menu** — Copy Link, Share (native OS share sheet), Report (with reason modal + backend storage)

### Profiles
- View any user's profile by ID
- Edit bio, gender, and profile picture
- **Debounced follow / unfollow** (400ms) — prevents race conditions from rapid clicks
- **Follow notifications** — notified in real-time when someone follows you
- Follower and following counts

### Explore
- Grid view of all posts
- Staggered fade-in animation using `IntersectionObserver`

### Real-time Messaging
- 1:1 direct messaging between users
- Real-time delivery via Socket.IO
- Online / offline status indicator per user
- **Typing indicators** — live "..." bubble when the other user is typing
- **Read receipts** — "Seen" label once the receiver opens the conversation
- **Media messages** — send images in chat (Multer + Cloudinary)
- **Conversation-based chat list** — shows only users you've actually messaged, sorted by most recent
- **Functional chat search** — local filter on conversation list
- Mobile-responsive: message panel slides in on user select

### Notifications
- Real-time like notifications via Socket.IO
- Real-time comment notifications
- Real-time follow notifications
- Notification badge count on sidebar
- Notification popup with auto-clear on mouse leave

### Search
- Debounced user search (400ms) with case-insensitive partial matching
- Results limited to 10 users

### Performance & Reliability
- **Error Boundaries** around every lazy-loaded route — prevents full-page crashes from component errors
- **Consistent HTTP status codes** — 400 for missing input, 401 for auth, 403 for forbidden, 404 for not found, 409 for conflict
- Cursor-based pagination reduces server load and database queries

---

## Project Structure

```
Astra/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── Components/      # Feature components (Chat, Posts, PostSkeleton, ErrorBoundary, etc.)
│   │   ├── hooks/           # Custom data-fetching hooks
│   │   ├── redux/           # Redux slices (auth, post, chat, socket, notifications)
│   │   ├── lib/             # Config and utilities
│   │   └── main/            # Main layout with sidebar
│   └── vercel.json          # SPA rewrite rules for Vercel
│
└── server/                  # Express backend
    ├── controllers/         # Route handlers (user, post, message)
    ├── models/              # Mongoose schemas (User, Post, Comment, Message, Conversation, Report)
    ├── routes/              # Express routers
    ├── middlewares/         # JWT auth middleware, rate limiter
    ├── socket/              # Socket.IO server setup
    └── utils/               # Cloudinary config, DB connection, datauri helper
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Cloudinary account

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
SECRET_KEY=your_jwt_access_token_secret
REFRESH_SECRET=your_jwt_refresh_token_secret
CLOUD_NAME=your_cloudinary_cloud_name
API_KEY=your_cloudinary_api_key
API_SECRET=your_cloudinary_api_secret
URL=http://localhost:5173
```

### Run Locally

```bash
# Install server dependencies
npm install

# Install client dependencies
cd client && npm install

# Build the client
npm run build

# Start the server (serves built client + API)
cd ..
npm start
```

Or run them separately for development:

```bash
# Terminal 1 — backend
npm run dev

# Terminal 2 — frontend
cd client && npm run dev
```

---

## Deployment

### Backend — Render
1. Connect your GitHub repo to Render
2. Set **Root Directory** to `/` (repo root)
3. Set **Build Command** to `cd client && npm install && npm run build && cd .. && npm install`
4. Set **Start Command** to `npm start`
5. Add all environment variables from `.env` in the Render dashboard
6. Set `URL` to your Vercel frontend URL (comma-separated if multiple)

### Frontend — Vercel
1. Import the repo on [vercel.com](https://vercel.com)
2. Set **Root Directory** to `client`
3. Framework preset: **Vite**
4. Build command: `npm run build` | Output directory: `dist`
5. Deploy — the `vercel.json` handles client-side routing automatically

---

## API Endpoints

### User
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/user/register` | Create account |
| POST | `/api/user/login` | Login |
| GET | `/api/user/logout` | Logout |
| GET | `/api/user/:id/profile` | Get user profile |
| POST | `/api/user/profile/edit` | Edit profile |
| GET | `/api/user/suggested` | Get suggested users |
| GET | `/api/user/search` | Search users by username |
| GET | `/api/user/check-username` | Check username availability |
| POST | `/api/user/followorunfollow/:id` | Follow or unfollow |

### Posts
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/post/addpost` | Create post |
| GET | `/api/post/all` | Get paginated posts (cursor-based) |
| GET | `/api/post/userpost/all` | Get logged-in user's posts |
| POST | `/api/post/:id/like` | Like a post |
| POST | `/api/post/:id/dislike` | Dislike a post |
| POST | `/api/post/:id/comment` | Add comment |
| POST | `/api/post/:id/comment/all` | Get post comments |
| DELETE | `/api/post/delete/:id` | Delete post |
| GET | `/api/post/:id/bookmark` | Bookmark / unbookmark |
| POST | `/api/post/:id/report` | Report a post |

### Messages
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/message/send/:id` | Send a message |
| GET | `/api/message/all/:id` | Get conversation messages |
| GET | `/api/message/conversations` | Get conversation list |

### Auth
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/verify-email/:token` | Verify email address |

---

## Planned / Future Improvements

### Features
- [ ] **Hashtag support** — tag posts and make hashtags searchable
- [ ] **User tagging** (@mentions) in posts and comments
- [ ] **Post editing** — allow author to update caption after creation
- [ ] **Stories** — 24-hour ephemeral content with MongoDB TTL index
- [ ] **Group chats** — multi-participant conversations

### Performance
- [ ] **React Query / SWR** — replace manual axios + Redux fetch pattern with declarative server state management

---

## License

MIT
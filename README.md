# Astra — Full-Stack Social Media Platform

A full-featured Instagram-inspired social media app built with React, Node.js, MongoDB, and Socket.IO. Supports real-time messaging, live notifications, image posts, follow/unfollow, bookmarks, and an explore feed — deployed across Vercel (frontend) and Render (backend).

**Live Demo:** [https://astra-link.vercel.app](https://astra-link.vercel.app)  
**Backend API:** [https://astra-yapg.onrender.com](https://astra-yapg.onrender.com)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, React Router v7 |
| State Management | Redux Toolkit, Redux Persist |
| Real-time | Socket.IO (client + server) |
| Backend | Node.js, Express.js (ESM) |
| Database | MongoDB, Mongoose |
| Auth | JWT (httpOnly cookies), bcrypt |
| Image Storage | Cloudinary, Multer, Sharp |
| Deployment | Vercel (frontend), Render (backend) |
| Animations | Framer Motion, Three.js, OGL |

---

## Features

### Authentication
- Register and login with email + password
- Passwords hashed with bcrypt (salt rounds: 10)
- JWT stored in `httpOnly` cookie — protected from XSS
- Auth state persisted across page refreshes via `redux-persist`
- Protected routes on both client and server

### Posts & Feed
- Create posts with image upload (required) and optional caption
- Images auto-resized to 800×800 JPEG at 80% quality via Sharp before Cloudinary upload
- Home feed sorted newest-first with full author and comment data
- Like / dislike posts with optimistic UI updates
- Comment on posts via a modal popup
- Bookmark / unbookmark posts
- Delete your own posts (cascades to comments)
- Author hover card with mini profile stats and last 3 posts

### Profiles
- View any user's profile by ID
- Edit bio, gender, and profile picture
- Follow / unfollow users
- Follower and following counts

### Explore
- Grid view of all posts
- Staggered fade-in animation using `IntersectionObserver`

### Real-time Messaging
- 1:1 direct messaging between users
- Real-time delivery via Socket.IO
- Online / offline status indicator per user
- Mobile-responsive: message panel slides in on user select

### Notifications
- Real-time like notifications via Socket.IO
- Notification badge count on sidebar
- Notification popup with auto-clear on mouse leave

### Search
- Debounced user search (400ms) with case-insensitive partial matching
- Results limited to 10 users

---

## Project Structure

```
Astra/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── Components/      # Feature components (Chat, Posts, Comment, etc.)
│   │   ├── hooks/           # Custom data-fetching hooks
│   │   ├── redux/           # Redux slices (auth, post, chat, socket, notifications)
│   │   ├── lib/             # Config and utilities
│   │   └── main/            # Main layout with sidebar
│   └── vercel.json          # SPA rewrite rules for Vercel
│
└── server/                  # Express backend
    ├── controllers/         # Route handlers (user, post, message)
    ├── models/              # Mongoose schemas (User, Post, Comment, Message, Conversation)
    ├── routes/              # Express routers
    ├── middlewares/         # JWT auth middleware
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
SECRET_KEY=your_jwt_secret
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
| POST | `/api/user/followorunfollow/:id` | Follow or unfollow |

### Posts
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/post/addpost` | Create post |
| GET | `/api/post/all` | Get all posts |
| GET | `/api/post/userpost/all` | Get logged-in user's posts |
| GET | `/api/post/:id/like` | Like a post |
| GET | `/api/post/:id/dislike` | Dislike a post |
| POST | `/api/post/:id/comment` | Add comment |
| POST | `/api/post/:id/comment/all` | Get post comments |
| DELETE | `/api/post/delete/:id` | Delete post |
| GET | `/api/post/:id/bookmark` | Bookmark / unbookmark |

### Messages
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/message/send/:id` | Send a message |
| GET | `/api/message/all/:id` | Get conversation messages |

---

## Planned Improvements

### High Priority — Bugs & Core Gaps
- [ ] **Add `timestamps: true` to Post model** — posts currently have no `createdAt` field, breaking feed sort order
- [ ] **Fix `isAuthenticated` middleware** — the `catch` block has no response, causing requests to hang on invalid tokens
- [ ] **Move `BASE_URL` to an environment variable** — currently hardcoded, breaks local development
- [ ] **Add pagination / infinite scroll to feed** — `getAllPost` fetches the entire database at once; will not scale
- [ ] **Fix bookmark toggle UI** — the API returns `type: "saved"/"unsaved"` but the client doesn't update the icon state

### Auth & Security
- [ ] **Forgot password / reset password flow** with email (Nodemailer or Resend)
- [ ] **Email verification on signup**
- [ ] **Refresh token mechanism** — current 1-day JWT expires silently with no re-auth prompt
- [ ] **Rate limiting on auth endpoints** (express-rate-limit)
- [ ] **Input sanitization** to prevent NoSQL injection (express-mongo-sanitize)
- [ ] **Username availability check** on registration with real-time feedback

### Features
- [ ] **Functional chat search** — the search input in the DM panel is currently a UI stub
- [ ] **Conversation-based chat list** — show actual past conversations instead of all suggested users
- [ ] **Typing indicators** in chat
- [ ] **Read receipts** for messages
- [ ] **Media messages** — send images in chat
- [ ] **Comment notifications** — currently only like events trigger notifications
- [ ] **Follow notifications** — notify when someone follows you
- [ ] **Post options** — implement Report, Share, Copy link (currently UI stubs)
- [ ] **Hashtag support** — tag posts and make hashtags searchable
- [ ] **User tagging** in posts and comments
- [ ] **Post editing** after creation
- [ ] **Stories** — 24-hour ephemeral content
- [ ] **Group chats**

### Performance & Code Quality
- [ ] **Cursor-based pagination** on feed and explore using MongoDB cursors
- [ ] **React Query or SWR** for server state — replace manual axios + Redux fetch pattern
- [ ] **Skeleton loaders** instead of spinner fallbacks
- [ ] **Image lazy loading** with blur-up placeholders on feed
- [ ] **Debounce follow/unfollow** to prevent rapid double-clicks
- [ ] **Error boundaries** around lazy-loaded route components
- [ ] **Consistent HTTP status codes** — several endpoints return 401 for validation errors (should be 400)

---

## License

MIT

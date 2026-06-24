# Astra — Feature Implementation Guide (`update.md`)

This file is a self-contained reference for every feature listed in the **Planned Improvements** section of the README.
For each feature you will find:
1. **What it is** — a plain-English explanation of the concept
2. **Why we need it** — the real reason this matters in a production app
3. **How to build it** — exact steps, which files to touch, and what code to write

Use this as your personal roadmap. Work through one item at a time, check it off in the README when done.

---

---

# ✅ COMPLETED FEATURES

These features have been fully implemented and are working in production.

| # | Feature | Section |
|---|---------|---------|
| 1 | Pagination / Infinite Scroll on Feed | High Priority |
| 2 | Fix Bookmark Toggle UI | High Priority |
| 3 | Email Verification on Signup | Auth & Security |
| 4 | Refresh Token Mechanism | Auth & Security |
| 5 | Rate Limiting on Auth Endpoints | Auth & Security |
| 6 | Input Sanitization (NoSQL Injection) | Auth & Security |
| 7 | Username Availability Check | Auth & Security |
| 8 | Functional Chat Search + Conversation-Based Chat List | Features |
| 9 | Typing Indicators | Features |
| 10 | Read Receipts | Features |
| 11 | Media Messages (Images in Chat) | Features |
| 12 | Comment Notifications | Features |
| 13 | Follow Notifications | Features |
| 14 | Post Options (Report, Share, Copy Link) | Features |
| 21 | Skeleton Loaders | Performance |
| 22 | Image Lazy Loading | Performance |
| 23 | Debounce Follow/Unfollow | Performance |
| 24 | Error Boundaries | Performance |
| 25 | Consistent HTTP Status Codes | Performance |

---

---

# 🚀 FUTURE UPDATES (Not Yet Implemented)

These features are planned but have not been built yet. Pick up from here.

| # | Feature | Priority |
|---|---------|----------|
| 15 | Hashtag Support | Medium |
| 16 | User Tagging (@mentions) | Medium |
| 17 | Post Editing | Medium |
| 18 | Stories (24-hour Ephemeral Content) | Low |
| 19 | Group Chats | Low |
| 20 | React Query / SWR | Performance |

---

---

## How to read this file

Each feature follows this structure:

```
### Feature Name
Concept   → What the idea is
Why       → Why it matters
Procedure → Numbered steps of exactly what to do
```

Files mentioned are relative to the project root (`/Astra`).

---

---

# SECTION 1 — HIGH PRIORITY (Bugs & Core Gaps)

---

## 1. Pagination / Infinite Scroll on the Feed

### Concept
Right now `getAllPost` does `Post.find()` with no limit — it pulls every document from MongoDB in one shot.
**Cursor-based pagination** splits the feed into pages. Each page returns N posts plus a "cursor" (the `_id` of the last post). The next request says "give me posts older than this cursor", and so on. On the frontend an `IntersectionObserver` watches a hidden div at the bottom of the page — when it scrolls into view, it triggers the next fetch automatically.

### Why
- Fetching 10,000 posts at once will crash the browser and time out the server.
- `_id` in MongoDB is already indexed. Filtering on `_id` is faster than sorting by a separate `createdAt` field.
- Infinite scroll feels native and is expected by users of social apps.

### Procedure

**Backend — `server/controllers/post.controller.js`**

1. In `getAllPost`, read two query params from the request:
   - `limit` (default: 10)
   - `cursor` (the `_id` of the last post the client already has — undefined on the first load)
2. Build a query object: if `cursor` exists, filter `{ _id: { $lt: cursor } }` (posts with an `_id` less than the cursor are older).
3. Fetch `limit + 1` posts (the extra one is a sentinel to detect whether a next page exists).
4. If posts returned > limit, pop the last one and set `hasMore = true`, else `hasMore = false`.
5. Set `nextCursor` = `_id` of the last post in the returned array (or `null` if no more pages).
6. Return `{ posts, nextCursor, hasMore, success: true }`.

```js
// inside getAllPost
const limit = parseInt(req.query.limit) || 10;
const cursor = req.query.cursor;
const query = cursor ? { _id: { $lt: cursor } } : {};

const posts = await Post.find(query)
  .sort({ _id: -1 })
  .limit(limit + 1)
  .populate(...)

const hasMore = posts.length > limit;
if (hasMore) posts.pop();
const nextCursor = hasMore ? posts[posts.length - 1]._id : null;

return res.json({ posts, nextCursor, hasMore, success: true });
```

**Redux — `client/src/redux/postSlice.js`**

1. Add a new reducer called `appendPosts` that spreads new posts onto the existing array instead of replacing it.

```js
appendPosts: (state, action) => {
  state.posts = [...state.posts, ...action.payload];
},
```

2. Export it alongside `setPosts` and `setSelectedPost`.

**Hook — `client/src/hooks/useGateAllPost.jsx`**

1. Add `useState` for: `cursor` (starts null), `hasMore` (starts true), `loading` (starts false).
2. Use a `useRef` flag so the initial fetch doesn't run twice in React StrictMode.
3. Create a `fetchPosts(isReset)` function:
   - If `isReset = true`, don't send a cursor and dispatch `setPosts` (replace).
   - If `isReset = false`, send the current cursor and dispatch `appendPosts` (append).
4. Call `fetchPosts(true)` on mount inside a `useEffect`.
5. Return `{ fetchMore: fetchPosts, hasMore, loading }`.

**Feed — `client/src/Components/Posts.jsx`**

1. Call `useGetAllPost()` here (remove it from `Main.jsx`).
2. Destructure `{ fetchMore, hasMore, loading }` from the hook.
3. Create a `sentinelRef = useRef(null)` and attach it to an empty `<div>` at the very bottom of the post list.
4. In a `useEffect`, create an `IntersectionObserver` that calls `fetchMore(false)` when the sentinel enters the viewport and `hasMore && !loading` is true.
5. Show a spinner while `loading` is true. Show a "You're all caught up" message when `!hasMore`.

---

## 2. Fix Bookmark Toggle UI

### Concept
When you click the bookmark icon, the API hits `/api/post/:id/bookmark`. The backend toggles the bookmark and returns `{ type: "saved" }` or `{ type: "unsaved" }`. The current frontend ignores the `type` field — it only shows a toast. So the icon never visually changes.

### Why
Users expect immediate visual feedback. Without it, they have no way to know if a post is bookmarked without refreshing the page.

### Procedure

**`client/src/Post/Post.jsx`**

1. Add a new `useState`:
   ```js
   const [bookmarked, setBookmarked] = useState(
     user?.bookmarks?.includes(post._id) || false
   );
   ```
   This initialises the icon correctly on first render based on the logged-in user's bookmarks array.

2. In `bookmarkHandler`, after a successful response, read `res.data.type`:
   ```js
   setBookmarked(res.data.type === "saved");
   ```

3. In the JSX, toggle a CSS class on the bookmark icon:
   ```jsx
   <span
     className={`material-symbols-outlined bo${bookmarked ? " bookmarked" : ""}`}
     onClick={bookmarkHandler}
   >
     bookmark
   </span>
   ```

**`client/src/Post/Post.css`**

4. Add a `.bookmarked` class that fills the icon (same technique as `.so` for the like button):
   ```css
   .bookmarked {
     font-variation-settings: 'FILL' 1;
     color: #fff;
   }
   ```

---

---

# SECTION 2 — AUTH & SECURITY

---

## 3. Email Verification on Signup

### Concept
After a user registers, they receive a unique link in their email. Clicking that link proves they own the address and activates their account.

### Why
Prevents throwaway/fake accounts. Ensures password-reset emails actually reach the person who owns the account.

### Procedure

**`server/models/user.model.js`**

1. Add two fields:
   ```js
   isVerified: { type: Boolean, default: false },
   emailVerifyToken: String,
   emailVerifyExpiry: Date,
   ```

**`server/controllers/user.controller.js` → `register`**

2. After creating the user, generate a token:
   ```js
   const rawToken = crypto.randomBytes(32).toString("hex");
   user.emailVerifyToken = crypto.createHash("sha256").update(rawToken).digest("hex");
   user.emailVerifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hrs
   await user.save();
   ```
3. Email the link `https://yoursite.com/verify-email/${rawToken}` to the user.

**New endpoint — `server/controllers/auth.controller.js`**

4. Create `verifyEmail`:
   - Hash the token from the URL.
   - Find the user with that hash and an unexpired `emailVerifyExpiry`.
   - Set `isVerified = true`, clear the token fields, save.

**`server/routes/auth.routes.js`**

5. Add `GET /verify-email/:token` → `verifyEmail`.

**`client` — New page `VerifyEmail.jsx`**

6. On mount, read `:token` from the URL, call the endpoint, show success or error.
7. Add the route to `App.jsx`.

---

## 4. Refresh Token Mechanism

### Concept
Access tokens (short-lived, e.g. 15 min) are sent with every API call. Refresh tokens (long-lived, e.g. 7 days) are stored in a secure cookie and used only to silently get a new access token before the old one expires. The user never sees a logout.

### Why
If an access token leaks (e.g., via a log), it's only valid for 15 minutes. Today, a stolen 1-day JWT gives an attacker a full day of access.

### Procedure

**`server/controllers/user.controller.js` → `login`**

1. Sign two tokens:
   ```js
   const accessToken  = jwt.sign({ userId }, process.env.SECRET_KEY, { expiresIn: "15m" });
   const refreshToken = jwt.sign({ userId }, process.env.REFRESH_SECRET, { expiresIn: "7d" });
   ```
2. Store `refreshToken` hashed in the user document.
3. Set the refresh token in a strict, `httpOnly`, `secure` cookie (different name, e.g. `refreshToken`).
4. Return the access token in the JSON body.

**`server/middleware/isAuthenticated.js`**

5. Verify the short-lived access token. Return `401` immediately if expired.

**New endpoint — `GET /api/auth/refresh`**

6. Read the refresh cookie, verify it against the DB hash, issue a new access token.

**Client — Axios interceptor**

7. In `client/src/lib/axiosInstance.js`, add a response interceptor that catches `401`, calls `/refresh`, then retries the original request.

---

## 5. Rate Limiting on Auth Endpoints

### Concept
Limit how many requests a single IP can make to login/register within a time window.

### Why
Without this, a bot can try millions of password combinations. `express-rate-limit` stops this at the middleware layer.

### Procedure

1. Install: `npm install express-rate-limit` (in `server/`).
2. Create `server/middleware/rateLimiter.js`:
   ```js
   import rateLimit from "express-rate-limit";
   export const authLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 10,
     message: { success: false, message: "Too many attempts. Try again in 15 minutes." },
   });
   ```
3. Apply it in `server/routes/user.routes.js`:
   ```js
   router.post("/login",    authLimiter, login);
   router.post("/register", authLimiter, register);
   ```

---

## 6. Input Sanitization (NoSQL Injection)

### Concept
A user can send `{ "email": { "$gt": "" } }` in a JSON body. MongoDB treats the `$gt` as a real operator, potentially matching every user. `express-mongo-sanitize` strips all keys starting with `$` from `req.body`.

### Why
This is a critical security hole — it can let someone log in as any user without a password.

### Procedure

1. Install: `npm install express-mongo-sanitize` (in `server/`).
2. In `server/index.js`, add before routes:
   ```js
   import mongoSanitize from "express-mongo-sanitize";
   app.use(mongoSanitize());
   ```
Done. That's the entire fix.

---

## 7. Username Availability Check

### Concept
As the user types their username in the signup form, the app silently checks if it's taken and shows a live indicator (green tick / red cross). This uses **debouncing** — the API is only called after the user stops typing for ~500ms to avoid spamming requests.

### Why
Much better UX than showing an error only after the user submits the full form.

### Procedure

**Backend — `server/controllers/user.controller.js`**

1. Add a new export:
   ```js
   export const checkUsername = async (req, res) => {
     const { username } = req.query;
     const taken = await User.exists({ username: username.trim() });
     return res.json({ available: !taken });
   };
   ```
2. Add route: `GET /api/user/check-username` → `checkUsername` (no auth needed).

**Frontend — `client/src/Register/Register.jsx`** (or wherever signup is)

3. Add a `useState` for `usernameStatus`: `"idle" | "checking" | "available" | "taken"`.
4. Attach an `onChange` handler to the username input.
5. Wrap the API call in `setTimeout` (debounce) — clear the old timeout before setting a new one.
6. Based on `usernameStatus`, render a green tick, red cross, or spinner next to the field.

---

---

# SECTION 3 — FEATURES

---

## 8. Functional Chat Search + Conversation-Based Chat List

### Concept (both together)
Currently the chat sidebar shows all suggested users (everyone in the app). It should instead show only people you've **actually messaged** — sorted by the most recent message. The search input should filter **this shorter list** locally in the browser, not fetch from the server.

### Why
Instagram, WhatsApp, etc. all do this. Showing random users in a "messages" panel is confusing and not how chat works.

### Procedure

**Backend — `server/controllers/message.controller.js`**

1. Create a `getConversations` function:
   ```js
   // Find all messages where the logged-in user is sender OR receiver
   const messages = await Message.find({
     $or: [{ senderId: req.id }, { receiverId: req.id }]
   }).sort({ createdAt: -1 });
   ```
2. From these messages, extract unique partner IDs (the "other" person in each conversation).
3. Fetch the User documents for those IDs.
4. Return them in order of the most recent message.

**Backend — `server/routes/message.routes.js`**

5. Add `GET /api/message/conversations` → `getConversations`.

**Frontend — `client/src/Components/Chat/Chat.jsx`**

6. On mount, call the new `/conversations` endpoint instead of using `suggestedUsers` from Redux.
7. Store the result in local `useState`.
8. Add a `useState` for the search query (e.g. `searchQuery`).
9. Filter the conversations list: `conversations.filter(u => u.username.toLowerCase().includes(searchQuery))`.
10. Pass `searchQuery` to the `<input>` value and bind `onChange` to `setSearchQuery`.

---

## 9. Typing Indicators

### Concept
When User A is typing a message to User B, User B sees a "..." bubble in real time. This is done via Socket.IO events, not the database.

### Why
Makes the chat feel live and responsive — a core expectation of any real-time messaging app.

### Procedure

**Backend — `server/socket/socket.js`**

1. Listen for a `"typing"` event. Emit it to the receiver's socket ID:
   ```js
   socket.on("typing", ({ receiverId }) => {
     const receiverSocketId = getReceiverSocketId(receiverId);
     if (receiverSocketId) io.to(receiverSocketId).emit("typing", { senderId: socket.userId });
   });
   socket.on("stopTyping", ({ receiverId }) => {
     const receiverSocketId = getReceiverSocketId(receiverId);
     if (receiverSocketId) io.to(receiverSocketId).emit("stopTyping", { senderId: socket.userId });
   });
   ```

**Frontend — `client/src/Components/Chat/Chat.jsx`**

2. On the message `<input>` `onChange`, emit `"typing"` to the server. After 2 seconds of no new input, emit `"stopTyping"` (use `clearTimeout`/`setTimeout`).
3. In a `useEffect`, listen on the socket for `"typing"` and `"stopTyping"` events. Toggle a `isTyping` state.
4. Conditionally render a small `<div className="typing-bubble">...</div>` when `isTyping` is true.

---

## 10. Read Receipts

### Concept
A "Seen" label appears under a message once the receiver has opened the conversation.

### Procedure

**`server/models/message.model.js`**

1. Add: `isRead: { type: Boolean, default: false }`.

**Backend — `server/controllers/message.controller.js`**

2. In `getMessage` (when a conversation is opened), after fetching messages, bulk-update all unread ones:
   ```js
   await Message.updateMany(
     { receiverId: req.id, senderId: req.params.id, isRead: false },
     { isRead: true }
   );
   ```
3. Emit a `"messagesRead"` socket event to the original sender.

**Frontend — `client/src/Components/message/Message.jsx`**

4. Listen for `"messagesRead"`. When received, update the local messages in state to set `isRead: true`.
5. Render `"Seen"` below the last message sent by the current user when `isRead` is true.

---

## 11. Media Messages (Images in Chat)

### Concept
Allow users to send an image file inside a chat message instead of only text.

### Procedure

**`server/models/message.model.js`**

1. Add `type: { type: String, enum: ["text", "image"], default: "text" }`.

**Backend — `server/controllers/message.controller.js` → `sendMessage`**

2. If `req.file` exists (set up Multer on this route), upload to Cloudinary, set the message content to the URL and `type` to `"image"`.

**Backend — `server/routes/message.routes.js`**

3. Apply Multer middleware to the `POST /send/:id` route.

**Frontend — `client/src/Components/Chat/Chat.jsx`**

4. Add a paperclip `<input type="file" accept="image/*">` next to the text input.
5. When a file is selected, use `FormData` to post it instead of JSON.

**Frontend — `client/src/Components/message/Message.jsx`**

6. When rendering a message, check `message.type`. If `"image"`, render an `<img>`. If `"text"`, render the text.

---

## 12. Comment Notifications

### Concept
When someone comments on your post, you get a real-time notification — the same way you do for likes.

### Why
Currently only likes trigger notifications. Comments are equally important for engagement.

### Procedure

**Backend — `server/controllers/post.controller.js` → `addComment`**

1. After saving the comment, find the post author's socket ID using `getReceiverSocketId(post.author)`.
2. If they are online, emit a `"notification"` event:
   ```js
   io.to(authorSocketId).emit("notification", {
     type: "comment",
     userId: req.id,
     userDetails: commenter,
     postId,
     message: `${commenter.username} commented on your post`,
   });
   ```
3. This mirrors exactly what you do in `likePost` — look at that function as your template.

**Frontend** — No changes needed. The existing notification listener in your socket setup will already pick this up.

---

## 13. Follow Notifications

### Concept
When someone follows you, you get a notification.

### Procedure

**Backend — `server/controllers/user.controller.js` → `followOrUnfollow`**

1. In the `else` branch (the "follow" case), after the DB update:
   ```js
   const followerDetails = await User.findById(followKrneWala).select("username profilePicture");
   const targetSocketId = getReceiverSocketId(jiskoFollowKarunga);
   if (targetSocketId) {
     io.to(targetSocketId).emit("notification", {
       type: "follow",
       userId: followKrneWala,
       userDetails: followerDetails,
       message: `${followerDetails.username} started following you`,
     });
   }
   ```
2. Import `{ io, getReceiverSocketId }` from your socket file.

---

## 14. Post Options (Report, Share, Copy Link)

### Concept
The three-dot menu on a post currently has placeholder options. They need real functionality:
- **Copy Link** — copies the post URL to clipboard.
- **Share** — uses the browser's native `navigator.share` API.
- **Report** — sends a flag to the backend and shows a confirmation.

### Procedure

**Copy Link** — `client/src/Components/PostTop/PostTop.jsx`

1. On click: `navigator.clipboard.writeText(`${window.location.origin}/post/${post._id}`)`.
2. Show a toast: "Link copied!".

**Share**

1. On click: `navigator.share({ url: window.location.href, title: post.caption })`. This opens the native OS share sheet. Wrap in a `try/catch` because desktop browsers may not support it.

**Report**

1. Add a `POST /api/post/:id/report` endpoint. Create a simple `Report` model with `postId`, `reportedBy`, `reason`.
2. On the frontend, clicking "Report" opens a small modal with reason options (spam, nudity, etc.).
3. On submit, call the endpoint and show a toast.

---

## 15. Hashtag Support

### Concept
Captions can contain `#tag` words. These are stored in an indexed array on the post. Clicking a hashtag goes to a page showing all posts with that tag.

### Procedure

**`server/models/post.model.js`**

1. Add: `hashtags: [{ type: String, index: true }]`.

**`server/controllers/post.controller.js` → `addPost`**

2. Parse the caption before saving:
   ```js
   const hashtags = (caption.match(/#\w+/g) || []).map(t => t.toLowerCase());
   ```
3. Save `hashtags` on the new post document.

**New endpoint — `GET /api/post/hashtag/:tag`**

4. Return `Post.find({ hashtags: tag }).sort({ createdAt: -1 }).limit(20)`.

**Frontend — `client/src/Post/Post.jsx`**

5. In the caption render, split by spaces and wrap any word starting with `#` in a `<Link to={/explore/${word.slice(1)}>`.

**New page — `client/src/pages/HashtagPage.jsx`**

6. Reads `:tag` from URL params, calls the new endpoint, renders a grid of posts.
7. Add route in `App.jsx`.

---

## 16. User Tagging in Posts and Comments

### Concept
`@username` in a caption or comment becomes a clickable link to that user's profile.

### Procedure

1. In `server/controllers/post.controller.js → addPost`, extract mentions: `caption.match(/@\w+/g)`.
2. Store them in a `mentions: [ObjectId]` array on the post model (resolved from usernames to IDs).
3. On the frontend, in any text renderer, split on spaces and wrap `@word` tokens in `<Link to={/profile/lookup?username=${word.slice(1)}>`.

---

## 17. Post Editing

### Concept
The post author can change the caption of an existing post.

### Procedure

**Backend — `server/controllers/post.controller.js`**

1. Add a `PUT /api/post/:id` handler:
   - Verify `post.author.toString() === req.id` (403 if not the author).
   - Update `post.caption` and save.

**Backend — `server/routes/post.routes.js`**

2. Add: `router.put("/:id", isAuthenticated, editPost)`.

**Frontend — `client/src/Components/PostTop/PostTop.jsx`**

3. Add an "Edit" option in the three-dot menu (only visible when `post.author._id === user._id`).
4. Clicking "Edit" opens a modal with a pre-filled textarea.
5. On submit, call the `PUT` endpoint and dispatch `setPosts` with the updated caption.

---

## 18. Stories (24-hour Ephemeral Content)

### Concept
A user uploads a photo that disappears after 24 hours. MongoDB's TTL (Time-To-Live) index handles deletion automatically — no cron job needed.

### Why
MongoDB has a built-in feature for this. You simply add an index on the `createdAt` field with `expireAfterSeconds: 86400` and MongoDB's background task deletes expired documents for you.

### Procedure

**`server/models/story.model.js`** (new file)

1. Create the model:
   ```js
   const storySchema = new Schema({
     author:    { type: ObjectId, ref: "User", required: true },
     image:     { type: String, required: true },
     viewers:   [{ type: ObjectId, ref: "User" }],
     createdAt: { type: Date, default: Date.now },
   });
   // TTL index — MongoDB auto-deletes documents 24 hours after createdAt
   storySchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });
   ```

**Backend endpoints**

2. `POST /api/story` — upload image to Cloudinary, create Story document.
3. `GET /api/story/feed` — fetch stories from users the logged-in user follows, grouped by author.
4. `GET /api/story/:id/view` — add `req.id` to the `viewers` array.

**Frontend**

5. Add a horizontal scrollable story bar at the top of the feed (above the posts).
6. Each circle is an author's avatar. Clicking opens a fullscreen story viewer with a progress bar that drains over a set time.

---

## 19. Group Chats

### Concept
A conversation involving more than 2 people. Messages are sent once but delivered to all participants.

### Procedure

**`server/models/conversation.model.js`** (update)

1. Add:
   ```js
   isGroup:      { type: Boolean, default: false },
   groupName:    String,
   groupAvatar:  String,
   admin:        { type: ObjectId, ref: "User" },
   // participants already exists — just ensure it allows > 2 members
   ```

**Backend — `server/controllers/message.controller.js` → `sendMessage`**

2. After saving the message, loop over all `conversation.participants` (excluding the sender) and emit the socket event to each one.

**Frontend**

3. Add a "New Group" button in the chat sidebar.
4. A modal lets you pick multiple users from your conversations list.
5. On submit, call `POST /api/message/group` which creates the conversation with `isGroup: true`.
6. In the chat view, check `selectedConversation.isGroup` and show the group name/avatar instead of a single user's info.

---

---

# SECTION 4 — PERFORMANCE & CODE QUALITY

---

## 20. React Query or SWR

### Concept
React Query is a library dedicated to managing server state — loading, error, caching, background refetching. Right now your app uses `useEffect + axios + Redux` for fetching, which requires you to manually manage every state.

### Why
- Eliminates boilerplate: no more manual `loading`, `error`, `useEffect` in every hook.
- Automatic caching: if you've already fetched a user profile, navigating back doesn't re-fetch it.
- Automatic background refresh: stale data is re-fetched silently when the window regains focus.

### Procedure

1. Install: `npm install @tanstack/react-query` in `client/`.
2. Wrap your app in `<QueryClientProvider client={queryClient}>` in `main.jsx`.
3. Replace a hook like `useGetAllPost` with:
   ```js
   const { data, isLoading } = useQuery({
     queryKey: ["posts"],
     queryFn: () => axios.get(`${BASE_URL}/api/post/all`).then(r => r.data.posts),
   });
   ```
4. For mutations (like, bookmark, follow), use `useMutation` + `queryClient.invalidateQueries(["posts"])` to auto-refresh.

---

## 21. Skeleton Loaders

### Concept
Instead of showing a spinner while posts load, show grey animated placeholder boxes in the exact shape of a post card. The real content "snaps in" once ready.

### Why
Skeleton screens look more professional and reduce perceived loading time because the user can see the layout before the content arrives.

### Procedure

**`client/src/Components/PostSkeleton.jsx`** (new file)

1. Create a component that renders a post-shaped div with grey animated bars:
   ```jsx
   function PostSkeleton() {
     return (
       <div className="post-skeleton">
         <div className="skel-avatar" />
         <div className="skel-image" />
         <div className="skel-line short" />
         <div className="skel-line" />
       </div>
     );
   }
   ```
2. Add CSS with a shimmer animation using `@keyframes` and a linear gradient.

**`client/src/Components/Posts.jsx`**

3. While `loading` is true and `posts.length === 0`, render `[...Array(3)].map(i => <PostSkeleton key={i} />)` instead.

---

## 22. Image Lazy Loading

### Concept
`loading="lazy"` is a native HTML attribute that tells the browser not to download an image until it is near the user's viewport. No JavaScript needed.

### Why
Saves data and speeds up initial page load — images below the fold are not downloaded at all until the user scrolls to them.

### Procedure

**`client/src/Post/Post.jsx`**

1. Simply add `loading="lazy"` to the post image:
   ```jsx
   <img src={post?.image} alt="post" className="posts-pic" loading="lazy" />
   ```

That is the complete implementation. Optionally, also add a low-resolution placeholder by setting a `style={{ backgroundColor: "#1a1a1a" }}` while the image loads.

---

## 23. Debounce Follow/Unfollow

### Concept
If a user clicks "Follow" and "Unfollow" rapidly 5 times, it sends 5 API calls. Debouncing ensures the call only fires once the user has stopped clicking for a set delay (e.g., 400ms).

### Why
Prevents race conditions where the DB ends up in an inconsistent state, and reduces unnecessary server load.

### Procedure

**`client/src/` — any Follow button component**

1. Install: `npm install lodash` in `client/` (or write a tiny custom `debounce` function).
2. Wrap the handler:
   ```js
   import { debounce } from "lodash";
   const debouncedFollow = useMemo(
     () => debounce(followHandler, 400),
     [followHandler]
   );
   ```
3. Attach `debouncedFollow` to the button's `onClick`.
4. In a `useEffect` cleanup, call `debouncedFollow.cancel()` to prevent stale calls on unmount.

---

## 24. Error Boundaries

### Concept
An Error Boundary is a React class component that wraps other components. If any child crashes during render, it catches the error and shows a fallback UI instead of crashing the entire page.

### Why
Right now if the `Post` component receives malformed data and throws, the entire app goes white. An Error Boundary limits the damage to just that one component.

### Procedure

**`client/src/Components/ErrorBoundary.jsx`** (new file)

1. Create the boundary:
   ```jsx
   import { Component } from "react";
   class ErrorBoundary extends Component {
     state = { hasError: false };
     static getDerivedStateFromError() { return { hasError: true }; }
     componentDidCatch(err, info) { console.error(err, info); }
     render() {
       if (this.state.hasError) {
         return <div className="error-fallback">Something went wrong. Please refresh.</div>;
       }
       return this.props.children;
     }
   }
   export default ErrorBoundary;
   ```

**`client/src/App.jsx`**

2. Wrap each lazy-loaded route:
   ```jsx
   <ErrorBoundary>
     <Suspense fallback={<Spinner />}>
       <Route path="/" element={<Posts />} />
     </Suspense>
   </ErrorBoundary>
   ```

---

## 25. Consistent HTTP Status Codes

### Concept
HTTP status codes have standardised meanings. Using the wrong one confuses API clients, debugging tools, and other developers.

| Code | Meaning                              | When to use |
|------|--------------------------------------|-------------|
| 200  | OK                                   | Successful GET/PUT |
| 201  | Created                              | Successful POST that creates a resource |
| 400  | Bad Request                          | Missing/invalid input from the user |
| 401  | Unauthorized                         | No token / expired token |
| 403  | Forbidden                            | Valid token but not allowed (wrong owner) |
| 404  | Not Found                            | Resource doesn't exist |
| 500  | Internal Server Error                | Unexpected crash |

### Why
Currently several endpoints return `401` for missing input fields (e.g., "email is required"). `401` strictly means "not logged in". This can confuse frontend error handlers and is incorrect by the HTTP spec.

### Procedure

1. In `server/controllers/user.controller.js`, search for all `res.status(401)` used for missing fields.
2. Change them to `res.status(400)`.
3. In `server/controllers/post.controller.js`, change any "you are not the author" responses from `401` to `403`.
4. Make sure `401` is used **only** in `isAuthenticated.js` middleware when the token is missing or invalid.

---

*End of update.md — work through each item top to bottom and cross it off in `README.md` when done.*

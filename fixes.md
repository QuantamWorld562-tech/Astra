# Astra — Open Fixes Guide

> [!NOTE]
> Fixes 1, 2, and 3 from the original list have been resolved. This document only covers the **2 remaining open items**.

---

## Fix 4 — Pagination / Infinite Scroll on Feed ⏳

### What's the problem?
Your [`post.controller.js`](file:///Users/kunalyadav/Documents/Projects/Astra/server/controllers/post.controller.js) `getAllPost` function does:

```js
const posts = await Post.find()   // ← fetches EVERY post in the database
  .sort({ createdAt: -1 })
  .populate(...)
```

And your hook [`useGateAllPost.jsx`](file:///Users/kunalyadav/Documents/Projects/Astra/client/src/hooks/useGateAllPost.jsx) fetches and stores all of them at once in Redux.

When you have 10,000 posts, this will:
- Overload your MongoDB query
- Send a massive JSON response (potentially MBs)
- Crash the user's browser tab from storing too much in memory

### Concept — Cursor-Based Pagination
Instead of fetching everything, you fetch a **page** at a time. The two common strategies are:

**Offset pagination** (simpler, less efficient):
```
GET /api/post/all?page=1&limit=10
GET /api/post/all?page=2&limit=10
```

**Cursor pagination** (better for feeds, handles real-time inserts):
```
GET /api/post/all?limit=10                           ← first page
GET /api/post/all?limit=10&cursor=<lastPostId>       ← next page
```

The cursor approach is what Instagram, Twitter, and TikTok use because if new posts are inserted while you scroll, offset pagination skips or duplicates posts. Cursor pagination always picks up exactly where you left off.

### Step 1 — Server: Update `getAllPost` in `post.controller.js`

```js
export const getAllPost = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const cursor = req.query.cursor; // the _id of the last post seen

    const query = cursor
      ? { _id: { $lt: cursor } }  // fetch posts OLDER than the cursor
      : {};

    const posts = await Post.find(query)
      .sort({ _id: -1 })          // newest first (uses _id index, very fast)
      .limit(limit + 1)           // fetch 1 extra to detect if there's a next page
      .populate({ path: "author", select: "username profilePicture bio followers following posts" })
      .populate({
        path: "comments",
        populate: { path: "author", select: "username profilePicture" },
      });

    const hasMore = posts.length > limit;
    if (hasMore) posts.pop();     // remove the extra post we fetched

    const nextCursor = hasMore ? posts[posts.length - 1]._id : null;

    return res.status(200).json({ posts, nextCursor, hasMore, success: true });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error", success: false });
  }
};
```

### Step 2 — Client: Rewrite `useGateAllPost.jsx`

```js
import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setPosts } from "../redux/postSlice";
import axios from "../lib/axiosInstance";
import { BASE_URL } from "../lib/config";

const useGetAllPost = () => {
  const dispatch = useDispatch();
  const posts = useSelector((store) => store.post.posts);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const fetchPosts = useCallback(async (reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const params = { limit: 10 };
      if (!reset && cursor) params.cursor = cursor;

      const res = await axios.get(`${BASE_URL}/api/post/all`, {
        params,
        withCredentials: true,
      });

      if (res.data.success) {
        // On reset (first load), replace posts. On scroll, append them.
        dispatch(setPosts(reset ? res.data.posts : [...posts, ...res.data.posts]));
        setCursor(res.data.nextCursor);
        setHasMore(res.data.hasMore);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, [cursor, loading, posts, dispatch]);

  // Load first page on mount
  useEffect(() => { fetchPosts(true); }, []);

  return { fetchMore: fetchPosts, hasMore, loading };
};

export default useGetAllPost;
```

### Step 3 — Client: Add IntersectionObserver in your feed component

```jsx
// In your feed/main page component
const { fetchMore, hasMore, loading } = useGetAllPost();
const bottomRef = useRef(null);

useEffect(() => {
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && hasMore && !loading) {
      fetchMore();
    }
  }, { threshold: 0.1 });

  if (bottomRef.current) observer.observe(bottomRef.current);
  return () => observer.disconnect();
}, [fetchMore, hasMore, loading]);

// In JSX, after your list of posts:
<div ref={bottomRef} style={{ height: 1 }} />
{loading && <p>Loading more posts...</p>}
```

### Why IntersectionObserver instead of scroll events?
Scroll event listeners fire hundreds of times per second and are expensive. `IntersectionObserver` fires **only when** the target element enters/exits the viewport — it's the modern, performant, browser-native way to do infinite scroll.

---

## Fix 5 — Bookmark Toggle UI ⏳

### What's the problem?
In your [`Post.jsx`](file:///Users/kunalyadav/Documents/Projects/Astra/client/src/Post/Post.jsx), the bookmark handler is:

```js
const bookmarkHandler = async () => {
  const res = await axios.get(`${BASE_URL}/api/post/${post?._id}/bookmark`, ...);
  if (res.data.success) {
    toast.success(res.data.message); // ← only shows a toast, NOTHING ELSE
  }
};
```

And in the JSX:
```jsx
<span className="material-symbols-outlined bo" onClick={bookmarkHandler}>
  bookmark   {/* ← this never changes, always shows the same icon */}
</span>
```

Your backend returns `type: "saved"` or `type: "unsaved"` in the response, but the client completely ignores the `type` field. The icon never changes visually.

### Step 1 — Add `bookmarked` state to `Post.jsx`

```js
// Derive initial state from the logged-in user's bookmarks array
const [bookmarked, setBookmarked] = useState(
  user?.bookmarks?.includes(post._id) || false
);
```

### Step 2 — Update `bookmarkHandler` to read `type` from the response

```js
const bookmarkHandler = async () => {
  try {
    const res = await axios.get(
      `${BASE_URL}/api/post/${post?._id}/bookmark`,
      { withCredentials: true }
    );
    if (res.data.success) {
      // "saved" means it was just bookmarked, "unsaved" means it was removed
      setBookmarked(res.data.type === "saved");
      toast.success(res.data.message);
    }
  } catch (error) {
    console.log(error);
    toast.error("Something went wrong");
  }
};
```

### Step 3 — Update the JSX to apply a filled style conditionally

```jsx
<span
  className={`material-symbols-outlined bo ${bookmarked ? "bookmarked" : ""}`}
  onClick={bookmarkHandler}
>
  bookmark
</span>
```

### Step 4 — Add CSS for the filled state in `Post.css`

```css
.material-symbols-outlined.bookmarked {
  font-variation-settings: 'FILL' 1;  /* Makes Material Symbol icons filled/solid */
  color: #fff;
}
```

### Why read `res.data.type` instead of just toggling with `!prev`?
Using `setBookmarked(prev => !prev)` would get out of sync if the network request fails or the user clicks rapidly. By setting state to `res.data.type === "saved"`, you **sync the UI to the server's actual state** — always correct, even after retries or errors.

> [!NOTE]
> For the initial `bookmarked` state to work, the logged-in user object from your auth API must include the `bookmarks` array. Check your `user.controller.js` login/profile response to ensure `bookmarks` is not excluded.

---

## Summary

| # | Fix | File(s) to change | Status |
|---|---|---|---|
| 4 | Pagination / infinite scroll | `server/controllers/post.controller.js`, `client/src/hooks/useGateAllPost.jsx`, feed component | ⏳ Open |
| 5 | Bookmark toggle UI | `client/src/Post/Post.jsx`, `Post.css` | ⏳ Open |

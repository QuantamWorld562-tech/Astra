import React, { useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Post from "../Post/Post";
import useGetAllPost from "../hooks/useGetAllPost";
import PostSkeleton from "./PostSkeleton";
import "./Posts.css";

function Posts() {
  // 1. Destructure infinite scroll variables from our custom hook
  const { fetchMore, hasMore, loading } = useGetAllPost();

  // 2. Grab posts from your Redux store
  const { posts } = useSelector(store => store.post);

  // 3. Create a ref for the sentinel element at the bottom of the feed
  const sentinelRef = useRef(null);

  // 4. Set up the IntersectionObserver
  useEffect(() => {
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !loading) {
          fetchMore(false);
        }
      },
      { root: null, rootMargin: '0px', threshold: 1.0 }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) observer.observe(currentSentinel);

    return () => {
      if (currentSentinel) observer.unobserve(currentSentinel);
    };
  }, [fetchMore, hasMore, loading]);

  return (
    <div className="posts-layout">
      <div className="posts-feed">
        {/* Show skeletons on the very first load (no posts yet + loading) */}
        {loading && posts?.length === 0
          ? [...Array(3)].map((_, i) => <PostSkeleton key={i} />)
          : posts?.map((post) => (
              <Post key={post._id} post={post} />
            ))
        }

        {/* Sentinel element tracked by the IntersectionObserver */}
        <div
          ref={sentinelRef}
          style={{ height: '1px', width: '100%', background: 'transparent' }}
          aria-hidden="true"
        />

        {/* Loading more indicator */}
        {loading && posts?.length > 0 && (
          <div className="feed-status">
            <p>Loading more posts...</p>
          </div>
        )}

        {/* End of feed message */}
        {!hasMore && posts?.length > 0 && (
          <div className="feed-status">
            <p>You&apos;re all caught up! 🎉</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Posts;
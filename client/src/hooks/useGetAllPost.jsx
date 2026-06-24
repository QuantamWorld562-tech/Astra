// import { setPosts } from "../redux/postSlice";
// import axios from "../lib/axiosInstance";
// import { useEffect } from "react";
// import {useDispatch} from "react-redux";
// import { BASE_URL } from "../lib/config";
// import { useState } from "react";
// const useGetAllPost = (refresh) => {
//     const dispatch = useDispatch();
//     useEffect(()=> {
//       const fetchAllPost = async () => {
//         try {
//             const res = await axios.get(`${BASE_URL}/api/post/all`, {withCredentials:true});
//             if(res.data.success) {
//                 dispatch(setPosts(res.data.posts));
//             }
//         } catch (error) {
//             console.log(error);
//         }
//       }
//       fetchAllPost();
//     },[refresh]);
// };
// export default useGetAllPost;

import { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { setPosts, appendPosts } from "../redux/postSlice"; 
import axios from "../lib/axiosInstance";
import { BASE_URL } from "../lib/config";

const useGetAllPost = (refresh) => {
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const dispatch = useDispatch();
  
  // Use refs to prevent React batching race conditions
  const isFirstRender = useRef(true);
  const fetchingRef = useRef(false);  //This ref ensures we only ever have one API request running at a time.

  const fetchPosts = async (isReset = false) => {
    // 1. Prevent overlapping fetches with a synchronous ref
    if (fetchingRef.current) return;
    
    // 2. Don't fetch "next page" if we haven't even loaded the first page yet
    if (!isReset && !cursor) return;

    fetchingRef.current = true;
    setLoading(true);
    
    try {
      const currentCursor = isReset ? null : cursor;

      const res = await axios.get(`${BASE_URL}/api/post/all`, {
        params: { limit: 10, cursor: currentCursor }, // Ask for 10 posts
        withCredentials: true,
      });

      if (res.data.success) {
        const { posts, nextCursor } = res.data;

        if (isReset) {
          dispatch(setPosts(posts));
        } else {
          dispatch(appendPosts(posts)); 
        }

        setCursor(nextCursor);
        // Rely purely on the backend's hasMore flag
        setHasMore(res.data.hasMore);
      }
    } catch (error) {
      console.log("Error fetching posts:", error);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  useEffect(() => {
    // Handle React 18 StrictMode double-mounting
    if (isFirstRender.current) {
      isFirstRender.current = false;
      fetchPosts(true);
      return; 
    }

    // If 'refresh' changes later, reset the feed
    fetchPosts(true);
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  return { fetchMore: fetchPosts, hasMore, loading };
};

export default useGetAllPost;
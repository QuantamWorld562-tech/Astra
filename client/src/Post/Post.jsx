import "./Post.css";
import CommentPop from "../Components/Comment/CommentPop";
import PostTop from "../Components/PostTop/PostTop";
import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setPosts, setSelectedPost } from "../redux/postSlice";
import axios from "../lib/axiosInstance";
import { toast } from "react-hot-toast";
import { BASE_URL } from "../lib/config";

const Post = ({ post }) => {
  const { user } = useSelector((store) => store.auth);
  const posts = useSelector((store) => store.post.posts);
  const dispatch = useDispatch();

  const [showPopup, setShowPopup] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [liked, setLiked] = useState(post.likes.includes(user?._id) || false);
  const [postLike, setPostLike] = useState(post.likes.length);
  const [bookmark, setBookmark] = useState(user?.bookmarks?.includes(post._id) || false);

  const handleCommentClick = () => {
    setIsPopupOpen(true);
    dispatch(setSelectedPost(post));
  };

  const handleMouseEnter = () => setShowPopup(true);
  const handleMouseLeave = () => setShowPopup(false);

  const likeOrDislike = async () => {
    try {
      const action = liked ? "dislike" : "like";
      const res = await axios.post(
        `${BASE_URL}/api/post/${post._id}/${action}`,
        {},
        { withCredentials: true },
      );

      if (res.data.success) {
        setPostLike((prev) => (liked ? prev - 1 : prev + 1));
        setLiked((prev) => !prev);

        const updatedPostData = posts.map((p) =>
          p._id === post._id
            ? {
              ...p,
              likes: liked
                ? p.likes.filter((id) => id !== user._id)
                : [...p.likes, user._id],
            }
            : p,
        );

        dispatch(setPosts(updatedPostData));
        toast.success(res.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  const bookmarkHandler = async () => {
    try {
      const res = await axios.get(
        `${BASE_URL}/api/post/${post?._id}/bookmark`,
        { withCredentials: true },
      );
      if (res.data.success) {
        toast.success(res.data.message);
        setBookmark(res.data.type === "saved");
      }
    } catch (error) {
      console.log(error);
    }
  };


  return (
    <div className="post-box">
      <PostTop
        user={post?.author?.username}
        post={post}
        handleMouseEnter={handleMouseEnter}
        handleMouseLeave={handleMouseLeave}
        showPopup={showPopup}
      />

      <div>
        <img src={post?.image} alt="post" className="posts-pic" loading="lazy" />
      </div>

      <div className="post-bottom">
        <div className="post-action">
          <span
            className={`material-symbols-outlined ${liked ? "so" : ""}`}
            onClick={likeOrDislike}
          >
            favorite
          </span>
          <span className="action-count">{postLike}</span>
        </div>
        <div className="post-action">
          <span
            onClick={handleCommentClick}
            className="material-symbols-outlined co"
          >
            mode_comment
          </span>
          <span className="action-count">{post?.comments?.length}</span>
        </div>
        <span className="material-symbols-outlined">near_me</span>
        <span
          className={`material-symbols-outlined bo ${bookmark ? "bookmarked" : ""}`}
          onClick={bookmarkHandler}
        >
          bookmark
        </span>
      </div>

      <CommentPop
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        post={post}
        liked={liked}
        setLiked={setLiked}
        postLike={postLike}
        setPostLike={setPostLike}
      />

      <div className="post-down">
        <p className="post-author">{post?.author?.username}</p>
        <p className="post-caption">{post?.caption}</p>
      </div>
    </div>
  );
};

export default Post;

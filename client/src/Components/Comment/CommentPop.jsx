import "./CommentPop.css";
import PostTop from "../PostTop/PostTop";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setPosts } from "../../redux/postSlice";
import axios from "../../lib/axiosInstance";
import { toast } from "react-hot-toast";
import Comment from "../Comment";
import { BASE_URL } from "../../lib/config";
const CommentPop = ({ isOpen, onClose, post,liked,setLiked,postLike,setPostLike }) => {
  const { posts } = useSelector((store) => store.post);
  const { user } = useSelector((store) => store.auth);
  const { selectedPost } = useSelector((store) => store.post);
  const dispatch = useDispatch();
  const [text, setText] = useState("");
  const [comments, setComments] = useState(post?.comments || []);

  if (!isOpen) return null;

  const changeEventHandler = (e) => {
    const inputText = e.target.value;
    setText(inputText.trim() ? inputText : "");
  };

  const commentHandler = async () => {
    if (!text.trim()) return;
    try {
      const res = await axios.post(
        `${BASE_URL}/api/post/${post._id}/comment`,
        { text },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        },
      );
      if (res.data.success) {
        const updatedComments = [...comments, res.data.comment];
        setComments(updatedComments);

        const updatedPosts = posts.map((p) =>
          p._id === post._id ? { ...p, comments: updatedComments } : p,
        );
        dispatch(setPosts(updatedPosts));

        toast.success("Comment added");
        setText("");
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Failed to add comment");
    }
  };

  const likeOrDislike = async () => {
    try {
      const action = liked ? "dislike" : "like";
      const res = await axios.post(
        `${BASE_URL}/api/post/${post._id}/${action}`,
        {},
        { withCredentials: true }
      );

      if (res.data.success) {
        console.log("true")
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
            : p
        );

        dispatch(setPosts(updatedPostData));
        toast.success(res.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="comment-box">
      <div className="comment-can">
        <div className="comment-left">
          <img
            src={selectedPost?.image}
            alt="P"
            className="comment-left-post"
          />
        </div>
        <div className="comment-right">
          <div className="comment-right-top">
            <PostTop post={post} />
          </div>
          <div className="comment-right-bottom">
            {comments.map((comment) => (
              <Comment key={comment._id} comment={comment} />
            ))}
          </div>

          <div className="comment-right-down">
            <div className="d1">
              <span className={`material-symbols-outlined ${liked ? "so" : ""}` } onClick={likeOrDislike} >favorite</span>
              <span className="material-symbols-outlined">mode_comment</span>

              <span className="material-symbols-outlined">near_me</span>
              <span className="material-symbols-outlined to">bookmark</span>
            </div>
            <p className="likes-count">{post?.likes?.length} likes</p>
            <div className="comment-add">
              <span className="material-symbols-outlined to">
                sentiment_excited
              </span>
              <input
                type="text"
                value={text}
                onChange={changeEventHandler}
                placeholder="Add a comment"
              />
              <p onClick={commentHandler} className="post-btn">
                Post
              </p>
            </div>
          </div>
        </div>
      </div>
      <button className="close-btn" onClick={onClose}>
        <span className="material-symbols-outlined">close</span>
      </button>
    </div>
  );
};

export default CommentPop;

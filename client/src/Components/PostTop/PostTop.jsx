import { useState } from "react";
import Avatar from "react-avatar";
import "./PostTop.css";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import axios from "../../lib/axiosInstance";
import { setPosts } from "../../redux/postSlice";
import { BASE_URL } from "../../lib/config";

const PostTop = ({post, handleMouseEnter, handleMouseLeave, showPopup }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");

  
  const { user } = useSelector(store => store.auth);
  const { posts } = useSelector(store => store.post);
  const dispatch = useDispatch();

  if (!post) return null;

  const postDot = [
    { text: "Report", type: "danger" },
    { text: "Unfollow", type: "danger" },
    { text: "Add to favorites" },
    { text: "Go to post" },
    { text: "Share to..." },
    { text: "Copy link" },
    { text: "About this account" },
  ];

  const deletePost = async () => {
    try {
      const res = await axios.delete(
        `${BASE_URL}/api/post/delete/${post._id}`,
        { withCredentials: true }
      );
      if (res.data.success) {
        dispatch(setPosts(posts.filter(p => p._id !== post._id)));
        toast.success(res.data.message);
        setShowMenu(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete post");
    }
  };

  const handleMenuClick = async (text) => {
    if (text === "Copy link") {
      try {
        await navigator.clipboard.writeText(`${window.location.origin}/post/${post._id}`);
        toast.success("Link copied!");
      } catch (err) {
        toast.error("Failed to copy link");
      }
      setShowMenu(false);
    } else if (text === "Share to...") {
      try {
        if (navigator.share) {
          await navigator.share({ url: `${window.location.origin}/post/${post._id}`, title: post.caption });
        } else {
          toast.error("Web Share API not supported in this browser");
        }
      } catch (err) {
        console.error("Error sharing", err);
      }
      setShowMenu(false);
    } else if (text === "Report") {
      setShowMenu(false);
      setShowReportModal(true);
    }
  };

  const submitReport = async () => {
    if (!reportReason) {
      toast.error("Please select a reason");
      return;
    }
    try {
      const res = await axios.post(
        `${BASE_URL}/api/post/${post._id}/report`,
        { reason: reportReason },
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        setShowReportModal(false);
        setReportReason("");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to report post");
    }
  };

  return (
    <div className="post-top">
      <div
        className="post-profile-wrap"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Avatar src={post.author?.profilePicture} size="40" round={true}  />
        <p className="post-name">{post.author?.username}</p>

        {showPopup && (
          <div className="popup">
            <div className="pop-top">
              <Avatar src={post.author?.profilePicture} size="50" round={true} />
              <h4>{post.author?.username}</h4>
              <p className="pop-bio"> {post.author?.bio} </p>
            </div>
            <div className="pop-top2">
              <div>
                <p> {post.author?.posts?.length} </p>
                <span>posts</span>
              </div>
              <div>
                <p> {post.author?.followers?.length} </p>
                <span>followers</span>
              </div>
              <div>
                <p>{post.author?.following?.length} </p>
                <span>following</span>
              </div>
            </div>
            <div className="pop-box">
              {posts
                .filter((p) => p.author?._id === post.author?._id && p.image)
                .slice(0, 3)
                .map((p) => (
                  <img key={p._id} src={p.image} alt="post" className="pop-img" />
                ))}
            </div>
            <div className="pop-down">
              <button className="pop-mess">Message</button>
              <button className="popup-follow-btn">Follow</button>
            </div>
          </div>
        )}
      </div>

      <span
        onClick={() => setShowMenu(!showMenu)}
        className="material-symbols-outlined menu-dot"
      >
        more_horiz
      </span>

      {showMenu && (
        <div className="menu-box">
          <div className="menu-pop">
            <ul>
              {postDot.map((item, index) => (
                <li
                  key={index}
                  className={item.type === "danger" ? "danger" : ""}
                  onClick={() => handleMenuClick(item.text)}
                >
                  {item.text}
                </li>
              ))}
              <li onClick={() => setShowMenu(false)}>Cancel</li>
              {
                user && user?._id===post?.author._id && <li onClick={deletePost} >Delete</li>
              }
            </ul>
          </div>
        </div>
      )}

      {showReportModal && (
        <div className="menu-box">
          <div className="menu-pop report-modal">
            <h3 className="report-modal-title">Report Post</h3>
            <ul className="report-modal-list">
              {["It's spam", "Nudity or sexual activity", "Hate speech or symbols", "Violence or dangerous organizations", "Sale of illegal or regulated goods", "Bullying or harassment"].map((reason, idx) => (
                <li 
                  key={idx} 
                  className={reportReason === reason ? "selected" : ""}
                  onClick={() => setReportReason(reason)}
                >
                  {reason}
                </li>
              ))}
            </ul>
            <div className="report-modal-actions">
              <button onClick={() => setShowReportModal(false)} className="report-modal-cancel">Cancel</button>
              <button onClick={submitReport} className="report-modal-submit">Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostTop;
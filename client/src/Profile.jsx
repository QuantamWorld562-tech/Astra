import "./Profile.css";
import Avatar from "react-avatar";
import useGetUserProfile from "./hooks/useGetUserProfile";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useState } from "react";
import axios from "../lib/axiosInstance";
import { toast } from "react-hot-toast";
import { setUserProfile, logout } from "./redux/authSlice";
import { BASE_URL } from "./lib/config";

function Profile() {
  const params = useParams();
  const userId = params.id;

  useGetUserProfile(userId);

  const { userProfile, user } = useSelector((store) => store.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("grid");

  const logoutHandler = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/user/logout`, {
        withCredentials: true,
      });
      if (res.data.success) {
        dispatch(logout());
        navigate("/login");
        toast.success(res.data.message);
      }
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  const isLoggedInUserProfile = user?._id === userProfile?._id;
  const isFollowing = userProfile?.followers?.includes(user?._id);

  const handleFollowUnfollow = async () => {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/user/followorunfollow/${userProfile._id}`,
        {},
        { withCredentials: true },
      );
      if (res.data.success) {
        // update followers list in redux so UI reflects immediately
        const updatedFollowers = isFollowing
          ? userProfile.followers.filter((id) => id !== user._id)
          : [...userProfile.followers, user._id];
        dispatch(
          setUserProfile({ ...userProfile, followers: updatedFollowers }),
        );
        toast.success(res.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  let displayPost = [];
  if (activeTab === "grid") {
    displayPost = userProfile?.posts;
  } else if (activeTab === "list") {
    displayPost = userProfile?.bookmarks;
  } else if (activeTab === "setting") {
    displayPost = [];
  } else if (activeTab === "tag") {
    displayPost = [];
  }

  return (
    <div className="prof-box">
      <div className="prof-top">
        <div className="prof-top-left">
          <Avatar src={userProfile?.profilePicture} round={true} size="140" />
        </div>
        <div className="prof-top-right">
          <h1>{userProfile?.username}</h1>
          <div>
            <p>
              <span className="b">{userProfile?.posts.length}</span> posts
            </p>
            <p>
              <span className="b">{userProfile?.followers.length}</span>{" "}
              followers
            </p>
            <p>
              <span className="b">{userProfile?.following.length}</span>{" "}
              following
            </p>
          </div>
          <p>{userProfile?.bio || "bio here...."}</p>

          {isLoggedInUserProfile ? (
            <>
              <Link to="/account/edit">
                <button className="prof-btn">Edit Profile</button>{" "}
              </Link>
              <button className="prof-btn">View Archive</button>
            </>
          ) : isFollowing ? (
            <>
              <button className="prof-btn" onClick={handleFollowUnfollow}>
                Following{" "}
                <span className="material-symbols-outlined min">
                  stat_minus_1
                </span>
              </button>
              <button className="prof-btn">Message</button>
            </>
          ) : (
            <button className="prof-follow-btn" onClick={handleFollowUnfollow}>
              Follow
            </button>
          )}
          <span className="material-symbols-outlined log" onClick={logoutHandler}>logout</span>
        </div>
      </div>

      <div className="prof-bottom">
        <span
          className={`material-symbols-outlined ${activeTab === "grid" ? "active" : "prof-tab-icon"}`}
          onClick={() => setActiveTab("grid")}
        >
          grid_on
        </span>
        <span
          className={`material-symbols-outlined ${activeTab === "list" ? "active" : "prof-tab-icon"}`}
          onClick={() => setActiveTab("list")}
        >
          bookmark
        </span>
        <span
          className={`material-symbols-outlined ${activeTab === "setting" ? "active" : "prof-tab-icon"}`}
          onClick={() => setActiveTab("setting")}
        >
          autorenew
        </span>
        <span
          className={`material-symbols-outlined ${activeTab === "tag" ? "active" : "prof-tab-icon"}`}
          onClick={() => setActiveTab("tag")}
        >
          person_pin
        </span>
      </div>

      <div className="prof-end">
        {displayPost?.map((post) => (
          <div className="post" key={post?._id}>
            <img src={post.image} alt="postimage" />
            <div className="post-overlay">
              🤍 {post.likes?.length || 0} &nbsp; 💬{" "}
              {post.comments?.length || 0}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Profile;

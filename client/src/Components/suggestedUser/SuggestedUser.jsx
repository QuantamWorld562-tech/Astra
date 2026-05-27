import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import Avatar from "react-avatar";
import { setSelectedUser } from "../../redux/authSlice";
import "./SuggestedUser.css";

const SuggestedUsers = () => {
  const { suggestedUsers } = useSelector((store) => store.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleMessage = (user) => {
    dispatch(setSelectedUser(user));
    navigate("/chat");
  };

  return (
    <div className="suggested-users">
      <div className="header">
        <h1 className="title">Suggested for you</h1>
        <span className="see-all">See All</span>
      </div>
      {suggestedUsers.map((user) => (
        <div key={user._id} className="user-row">
          <div className="user-info">
            <Link to={`/profile/${user?._id}`}>
              <Avatar src={user?.profilePicture} name={user?.username} round={true} size="40" />
            </Link>
            <div className="user-text">
              <h1 className="username">
                <Link to={`/profile/${user?._id}`}>{user?.username}</Link>
              </h1>
              <span className="bio">{user?.bio || "Bio here..."}</span>
            </div>
          </div>
          <div className="user-actions">
            <span className="follow-btn">Follow</span>
            <span className="message-btn" onClick={() => handleMessage(user)}>Message</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SuggestedUsers;

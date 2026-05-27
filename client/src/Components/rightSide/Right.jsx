import Avatar from 'react-avatar';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import SuggestedUsers from '../suggestedUser/SuggestedUser';
import './Right.css';

const RightSidebar = () => {
  const { user } = useSelector(store => store.auth);
  return (
    <div className="right-sidebar">
      <div className="profile-box">
        <Link to={`/profile/${user?._id}`}>
          <Avatar src={user?.profilePicture} name={user?.username} round={true} size="44" />
        </Link>
        <div className="profile-info">
          <h1 className="username">
            <Link to={`/profile/${user?._id}`}>{user?.username}</Link>
          </h1>
          <span className="bio">{user?.bio || 'Bio here...'}</span>
        </div>
      </div>
      <SuggestedUsers />
    </div>
  );
};

export default RightSidebar;

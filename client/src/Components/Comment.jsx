import Avatar from "react-avatar";
import "./Comment.css";

function Comment({ comment }) {
  return (
    <div className="comment-item">
      <Avatar
        src={comment?.author?.profilePicture}
        name={comment?.author?.username}
        size="32"
        round={true}
      />
      <div className="comment-content">
        <span className="comment-username">{comment?.author?.username}</span>
        <span className="comment-text">{comment?.text}</span>
      </div>
    </div>
  );
}

export default Comment;

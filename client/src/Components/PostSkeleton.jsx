import "./PostSkeleton.css";

function PostSkeleton() {
  return (
    <div className="post-skeleton">
      <div className="skel-header">
        <div className="skel-avatar" />
        <div className="skel-name" />
      </div>
      <div className="skel-image" />
      <div className="skel-actions">
        <div className="skel-icon" />
        <div className="skel-icon" />
        <div className="skel-icon" />
      </div>
      <div className="skel-line short" />
      <div className="skel-line" />
    </div>
  );
}

export default PostSkeleton;

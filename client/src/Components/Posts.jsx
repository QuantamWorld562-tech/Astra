import { useSelector } from 'react-redux';
import Post from "../Post/Post";
import RightSidebar from "./rightSide/Right";
import "./Posts.css";

function Posts() {
  const { posts } = useSelector(store => store.post);

  return (
    <div className="posts-layout">
      <div className="posts-feed">
        {posts.map((post) => <Post key={post._id} post={post} />)}
      </div>
      {/* <div className="posts-right">
        <RightSidebar />
      </div> */}
    </div>
  );
}

export default Posts;

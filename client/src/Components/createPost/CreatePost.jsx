import { useState, useRef } from "react";
import "./CreatePost.css";
import Avatar from "react-avatar";
import { readFileAsDataURL } from "../../lib/utils";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { setPosts } from "../../redux/postSlice";
import { BASE_URL } from "../../lib/config";function CreatePost({ open, setOpen }) {
  const imageRef = useRef();
  const [file, setFile] = useState("");
  const [caption, setCaption] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const {user} = useSelector(store=>store.auth);
  const {posts} = useSelector(store=>store.post);
  const dispatch = useDispatch();

  if (!open) return null;

  const fileChangeHandler = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      const dataUrl = await readFileAsDataURL(file);
      setImagePreview(dataUrl);
    }
  };

  const createPostHandler = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("caption", caption);
    if (imagePreview) formData.append("image", file);
    try {
      setLoading(true);
      const res = await axios.post(
        `${BASE_URL}/api/post/addpost`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        },
      );
      if (res.data.success) {
        dispatch(setPosts([res.data.post,...posts]))
        toast.success(res.data.message);
        setOpen(false);
        setCaption("");
        setImagePreview("");
        setFile("");
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-can">
      <div className="create-box">
        
        <h1 className="create-title">Create New Post</h1>
          <span className="material-symbols-outlined cross " onClick={()=>setOpen(false)} >close</span>
        <div className="create-header">
          <Avatar src={user?.profilePicture} size="40" round={true} className="create-avatar" />
          <div className="create-profile-info">
            <p className="create-username"> {user?.username} </p>
            <p className="create-bio"> {user?.bio} </p>
          
          </div>
        </div>

        <form className="create-form" onSubmit={createPostHandler}>
          <input
            type="text"
            className="create-caption"
            placeholder="Write a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />

          {imagePreview && (
            <div className="create-post-image">
              <img src={imagePreview} alt="Preview_image" />
            </div>
          )}

          <input
            ref={imageRef}
            type="file"
            className="create-file-input"
            onChange={fileChangeHandler}
            hidden
          />

          <button
            type="button"
            className="create-upload-btn"
            onClick={() => imageRef.current.click()}
          >
            Select from Computer
          </button>

          {imagePreview && (
            loading ? (
              <button disabled className="create-submit-btn">
                <Loader2 className="spin" /> Please wait
              </button>
            ) : (
              <button type="submit" className="create-submit-btn" >
                Post
              </button>
            )
          )}
        </form>
      </div>
    </div>
  );
}

export default CreatePost;

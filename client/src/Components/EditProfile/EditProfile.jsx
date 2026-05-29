import React, { useRef, useState } from "react";
import "./EditProfile.css";
import Avatar from "react-avatar";
import { useDispatch, useSelector } from "react-redux";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "../../lib/axiosInstance";
import { toast } from "react-hot-toast";
import { setAuthUser } from "../../redux/authSlice";
import { BASE_URL } from "../../lib/config";

function EditProfile() {
  const imageRef = useRef();
  const { user } = useSelector((store) => store.auth);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState({
    profilePhoto: user?.profilePicture,
    bio: user?.bio || "",
    gender: user?.gender || "",
  });
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const fileChangeHandler = (e) => {
    const file = e.target.files?.[0];
    if (file) setInput({ ...input, profilePhoto: file });
  };

  const selectChangeHandler = (e) => {
    setInput({ ...input, gender: e.target.value });
  };

  const editProfileHandler = async () => {
    const formData = new FormData();
    formData.append("bio", input.bio);
    formData.append("gender", input.gender);
    if (input.profilePhoto) {
      formData.append("profilePhoto", input.profilePhoto);
    }

    try {
      setLoading(true);
      const res = await axios.post(
        `${BASE_URL}/api/user/profile/edit`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );

      if (res.data.success) {
        const updatedUserData = {
          ...user,
          bio: res.data.user?.bio,
          profilePicture: res.data.user?.profilePicture,
          gender: res.data.user?.gender,
        };
        dispatch(setAuthUser(updatedUserData));
        navigate(`/profile/${user._id}`);
        toast.success(res.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Server error, please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="Edit-can">
      <h1>Edit Profile</h1>
      <div className="pr-box">
        <Avatar
          src={
            input.profilePhoto instanceof File
              ? URL.createObjectURL(input.profilePhoto)
              : input.profilePhoto
          }
          round={true}
          size="40"
        />
        <div>
          <h3>{user?.username}</h3>
          <p className="bio">{user?.bio || "Bio here...."}</p>
        </div>
        <input
          ref={imageRef}
          onChange={fileChangeHandler}
          type="file"
          style={{ display: "none" }}
        />
        <button
          onClick={() => imageRef.current && imageRef.current.click()}
          className="change-photo"
        >
          Change Photo
        </button>
      </div>

      <h1>Bio</h1>
      <textarea
        className="bio-area"
        value={input.bio}
        onChange={(e) => setInput({ ...input, bio: e.target.value })}
      />

      <h1>Gender</h1>
      <select
        value={input.gender}
        onChange={selectChangeHandler}
        className="gender-select"
      >
        <option value="">-- Select Gender --</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="other">Other</option>
      </select>

      {loading ? (
        <button className="pro-submit" disabled>
          <Loader2 />
          Please wait
        </button>
      ) : (
        <button onClick={editProfileHandler} className="pro-submit">
          Submit
        </button>
      )}
    </div>
  );
}

export default EditProfile;

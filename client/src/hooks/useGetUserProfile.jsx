import { setUserProfile } from "../redux/authSlice.js"
import axios from "../lib/axiosInstance";
import { useEffect } from "react";
import { useDispatch } from "react-redux";

function useGetUserProfile(userId) {
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // axiosInstance already has baseURL set to BASE_URL — don't prefix again
        // or it creates a double-URL like https://api.com/https://api.com/...
        const res = await axios.get(`/api/user/${userId}/profile`, { withCredentials: true });
        if (res.data.success) {
          dispatch(setUserProfile(res.data.user));
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      }
    };

    if (userId) {
      fetchUserProfile();
    }
  }, [userId, dispatch]);
}

export default useGetUserProfile;

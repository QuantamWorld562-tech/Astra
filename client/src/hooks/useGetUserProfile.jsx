import { setUserProfile } from "../redux/authSlice.js"
import axios from "../lib/axiosInstance";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { BASE_URL } from "../lib/config";

function useGetUserProfile(userId) {
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/user/${userId}/profile`, { withCredentials: true });
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

import { setSuggestedUsers } from "../redux/authSlice.js";
import axios from "../lib/axiosInstance";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { BASE_URL } from "../lib/config";


const useGetSuggestedUsers = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        const fetchSuggestedUsers = async () => {
            try {
                const res = await axios.get(`${BASE_URL}/api/user/suggested`, { withCredentials: true });
                if (res.data.success) { 
                    dispatch(setSuggestedUsers(res.data.users));
                }
            } catch (error) {
                console.log(error);
            }
        }
        fetchSuggestedUsers();
    }, []);
};
export default useGetSuggestedUsers;
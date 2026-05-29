import { setPosts } from "../redux/postSlice";
import axios from "../lib/axiosInstance";
import { useEffect } from "react";
import {useDispatch} from "react-redux";
import { BASE_URL } from "../lib/config";

const useGetAllPost = (refresh) => {
    const dispatch = useDispatch();
    useEffect(()=> {
      const fetchAllPost = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/api/post/all`, {withCredentials:true});
            if(res.data.success) {
                dispatch(setPosts(res.data.posts));
            }
        } catch (error) {
            console.log(error);
        }
      }
      fetchAllPost();
    },[refresh]);
};

export default useGetAllPost;
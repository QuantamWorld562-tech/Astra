import { setMessages } from "../redux/chatSlice";
import axios from "axios";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BASE_URL } from "../lib/config";

const useGetAllMessage = () => {
    const dispatch = useDispatch();
    const { selectedUser } = useSelector((store) => store.auth);

    useEffect(() => {
        if (!selectedUser?._id) return;
        const fetchAllMessage = async () => {
            try {
                const res = await axios.get(`${BASE_URL}/api/message/all/${selectedUser._id}`, { withCredentials: true });
                if (res.data.success) {
                    dispatch(setMessages(res.data.messages));
                }
            } catch (error) {
                console.log(error);
            }
        };
        fetchAllMessage();
    }, [selectedUser]);
};

export default useGetAllMessage;
import { useEffect, useState } from "react";
import "./Chat.css";
import { useSelector, useDispatch } from "react-redux";
import { setSelectedUser } from "../../redux/authSlice";
import { setMessages } from "../../redux/chatSlice";
import Avatar from "react-avatar";
import Message from "../message/Message";
import axios from "../../lib/axiosInstance";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../../lib/config";


function Chat() {
  const [textMessage, setTextMessage] = useState("");
  const { user, selectedUser, suggestedUsers } = useSelector((store) => store.auth);
  const { onlineUsers, messages } = useSelector((store) => store.chat);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const sendMessageHandler = async (receiverId) => {
    if (!textMessage.trim()) return;
    try {
      const res = await axios.post(
        `${BASE_URL}/api/message/send/${receiverId}`,
        { textMessage },
        { headers: { "Content-Type": "application/json" }, withCredentials: true }
      );
      if (res.data.success) {
        dispatch(setMessages([...(messages || []), res.data.newMessage]));
        setTextMessage("");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    return () => {
      dispatch(setSelectedUser(null));
    };
  }, []);

    const handleUserClick = (userId) => {
    navigate(`/profile/${userId}`);
    onClose?.();
  };

  return (
    <div className="chat-layout">
 

      {/* Left: user list */}
      <div className="chat">
        <div className="chat-top">
          <h2>{user?.username}</h2>
          <span className="material-symbols-outlined">edit_square</span>
        </div>
        <div className="chat-search">
          <span className="material-symbols-outlined">search</span>
          <input type="text" placeholder="Search" />
        </div>

        <div className="chat-me">
          <Avatar src={user?.profilePicture} name={user?.username} round={true} size="42" />
          <p className="chat-me-name">{user?.username}</p>
        </div>

        <div className="chat-bottom">
          <div className="chat-bottom-head">
            <h5>Messages</h5>
            <p>Requests</p>
          </div>
          {(suggestedUsers || []).map((u) => {
            const isOnline = onlineUsers.includes(u._id);
            return (
              <div
                key={u._id}
                className={`user-box ${selectedUser?._id === u._id ? "active-user" : ""}`}
                onClick={() => dispatch(setSelectedUser(u))}
              >
                <div className="user-avatar-wrap">
                  <Avatar src={u.profilePicture} name={u.username} round={true} size="48" />
                  <span className={`online-dot ${isOnline ? "dot-green" : "dot-grey"}`} />
                </div>
                <div className="user-info">
                  <span className="user-name">{u.username}</span>
                  <span className={`user-status ${isOnline ? "green" : "grey"}`}>
                    {isOnline ? "Active now" : "Offline"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: message panel — gets .active on mobile when user selected */}
      <div className={`message-panel ${selectedUser ? "active" : ""}`}>
        {selectedUser ? (
          <div className="chat-pg">
            <div className="pg-top">
              {/* Back button — only visible on mobile via CSS */}
              <button
                className="chat-back-btn"
                onClick={() => dispatch(setSelectedUser(null))}
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <div className="pg-top-avatar" onClick={() => navigate(`/profile/${selectedUser._id}`)}>
                <Avatar
                  src={selectedUser?.profilePicture}
                  name={selectedUser?.username}
                  round={true}
                  size="42"
                />
                <span className={`online-dot ${onlineUsers.includes(selectedUser?._id) ? "dot-green" : "dot-grey"}`} />
              </div>
              <div className="pg-top-info">
                <span className="pg-top-name">{selectedUser?.username}</span>
                <span className={onlineUsers.includes(selectedUser?._id) ? "green" : "grey"}>
                  {onlineUsers.includes(selectedUser?._id) ? "Active now" : "Offline"}
                </span>
              </div>
            </div>

            <Message />

            <div className="pg-end">
              <input
                type="text"
                value={textMessage}
                onChange={(e) => setTextMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessageHandler(selectedUser?._id)}
                placeholder="Message..."
              />
              <button
                onClick={() => sendMessageHandler(selectedUser?._id)}
                disabled={!textMessage.trim()}
              >
                Send
              </button>
            </div>
          </div>
        ) : (
          <div className="no-chat">
            <span className="material-symbols-outlined no-chat-icon">forum</span>
            <h3>Your messages</h3>
            <p>Send a message to start a chat.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Chat;

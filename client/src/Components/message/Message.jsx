import "./Message.css";
import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import useGetAllMessage from "../../hooks/useGetAllMessage";
import useGetRTM from "../../hooks/useGetRTM";

function Message() {
  useGetRTM();
  useGetAllMessage();
  const bottomRef = useRef(null);
  const { messages } = useSelector((store) => store.chat);
  const { user } = useSelector((store) => store.auth);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="message-sc">
      {(messages || []).map((msg) => {
        const isSender = msg.senderId === user?._id;
        return (
          <div key={msg._id} className={`mess-row ${isSender ? "send-row" : "receive-row"}`}>
            <div className={`bubble ${isSender ? "bubble-send" : "bubble-receive"}`}>
              {msg.message}
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}

export default Message;

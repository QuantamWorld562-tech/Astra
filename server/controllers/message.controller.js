import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

// SEND MESSAGE - sends a message from one user to another
export const sendMessage = async (req, res) => {
  try {
    const senderId = req.id; // logged-in user (the one sending)
    const receiverId = req.params.id; // the person receiving the message (from URL)
    const {textMessage:message } = req.body; // the actual message text

    // look for an existing conversation between these two users
    // $all means both IDs must exist in the participants array
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    // if they've never chatted before, create a new conversation thread
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }

    // create the new message document
    const newMessage = await Message.create({
      senderId,
      receiverId,
      message,
    });

    // add the new message's ID to the conversation's messages array
    if (newMessage) conversation.messages.push(newMessage._id);

    // save both the conversation and message at the same time (faster than one by one)
    await Promise.all([conversation.save(), newMessage.save()]);

    // TODO: implement socket.io here for real-time delivery
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    return res.status(201).json({ success: true, newMessage });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// GET MESSAGES - returns all messages in a conversation between two users
export const getMessage = async (req, res) => {
  try {
    const senderId = req.id; // logged-in user
    const receiverId = req.params.id; // the other person in the chat

    // find the conversation between these two users
    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    }).populate("messages"); // populate replaces message IDs with actual message data

    // if no conversation exists yet, return empty array
    if (!conversation)
      return res.status(200).json({ success: true, messages: [] });

    return res
      .status(200)
      .json({ success: true, messages: conversation.messages });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

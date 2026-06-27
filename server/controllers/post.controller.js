import sharp from "sharp";
import cloudinary from "../utils/cloudinary.js";
import { Post } from "../models/post.model.js";
import { User } from "../models/user.model.js";
import { Comment } from "../models/comment.model.js";
import { Report } from "../models/report.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

// ADD NEW POST - creates a new post with an image and optional caption
export const addNewPost = async (req, res) => {
  try {
    const { caption } = req.body; // optional text under the post
    const image = req.file; // image file uploaded via multer
    const authorId = req.id; // logged-in user's ID from isAuthenticated middleware

    // image is required — can't post without one
    if (!image) return res.status(400).json({ message: "Image required" });

    // resize image to max 800x800 and compress to 80% quality
    // fit:'inside' means it won't crop — just shrinks to fit within 800x800
    const optimizedImageBuffer = await sharp(image.buffer)
      .resize({ width: 800, height: 800, fit: "inside" })
      .toFormat("jpeg", { quality: 80 })
      .toBuffer();

    // convert the image buffer to a base64 string so cloudinary can accept it
    const fileUri = `data:image/jpeg;base64,${optimizedImageBuffer.toString("base64")}`;

    // upload the image to cloudinary and get back a hosted URL
    const cloudResponse = await cloudinary.uploader.upload(fileUri);

    // save the post to the database with the cloudinary image URL
    const post = await Post.create({
      caption,
      image: cloudResponse.secure_url, // the public URL of the uploaded image
      author: authorId,
    });

    // also add this post's ID to the user's posts array
    const user = await User.findById(authorId);
    if (user) {
      user.posts.push(post._id);
      await user.save();
    }

    // populate author info so the response includes username etc. instead of just an ID
    await post.populate({ path: "author", select: "-password" });

    return res.status(201).json({
      message: "New post added",
      post,
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error", success: false });
  }
};

// GET ALL POSTS - returns every post, newest first (for the home feed)
// export const getAllPost = async (req, res) => {
//   try {
//     const posts = await Post.find()
//       .sort({ createdAt: -1 }) // -1 = descending = newest first
//       .populate({ path: "author", select: "username profilePicture bio followers following posts" }) // include extra fields for PostTop popup
//       .populate({
//         path: "comments",
//         options: { sort: { createdAt: -1 } },
//         populate: {
//           path: "author", // also get the author info inside each comment
//           select: "username profilePicture",
//         },
//       });

//     return res.status(200).json({ posts, success: true });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({ message: "Internal server error", success: false });
//   }
// };

export const getAllPost = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const cursor = req.query.cursor;
    const query = cursor ? {_id: { $lt: cursor } }: {} ;

    const posts = await Post.find(query)
      .sort({ _id: -1 }) // -1 = descending = newest first
      .limit(limit+1)
      .populate({ path: "author", select: "username profilePicture bio followers following posts" }) // include extra fields for PostTop popup
      .populate({
        path: "comments",
        options: { sort: { createdAt: -1 } },
        populate: {
          path: "author", // also get the author info inside each comment
          select: "username profilePicture",
        },
      });

      const hasMore = posts.length > limit;
      if(hasMore) posts.pop();
      const nextCursor = hasMore ? posts[posts.length - 1]._id : null ;

    return res.status(200).json({ posts,nextCursor,hasMore, success: true });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error", success: false });
  }
};

// GET USER POSTS - returns only the logged-in user's posts (for profile page)
export const getUserPost = async (req, res) => {
  try {
    const authorId = req.id; // logged-in user's ID

    // filter posts where author matches the logged-in user
    const posts = await Post.find({ author: authorId })
      .sort({ createdAt: -1 })
      .populate({ path: "author", select: "username profilePicture" })
      .populate({
        path: "comments",
        options: { sort: { createdAt: -1 } },
        populate: { path: "author", select: "username profilePicture" },
      });

    return res.status(200).json({ posts, success: true });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error", success: false });
  }
};

// LIKE POST - adds the user's ID to the post's likes array
export const likePost = async (req, res) => {
  try {
    const likeKrneWalaUserKiId = req.id; // the user who clicked like
    const postId = req.params.id; // the post being liked

    const post = await Post.findById(postId);
    if (!post)
      return res
        .status(404)
        .json({ message: "Post not found", success: false });

    // $addToSet adds the ID only if it's not already there — prevents duplicate likes
    await post.updateOne({ $addToSet: { likes: likeKrneWalaUserKiId } });
    await post.save();

    // implement socket io for real time notification
    const user = await User.findById(likeKrneWalaUserKiId).select(
      "username profilePicture",
    );
    const postOwnerId = post.author.toString();
    if (postOwnerId !== likeKrneWalaUserKiId) {
      const notification = {
        type: "like",
        userId: likeKrneWalaUserKiId,
        userDetails: user,
        postId,
        message: "Your post was liked",
      };
      const postOwnerSocketId = getReceiverSocketId(postOwnerId);
      io.to(postOwnerSocketId).emit("notification", notification);
    }

    return res.status(200).json({ message: "Post liked", success: true });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error", success: false });
  }
};

// DISLIKE POST - removes the user's ID from the post's likes array
export const dislikePost = async (req, res) => {
  try {
    const likeKrneWalaUserKiId = req.id;
    const postId = req.params.id;

    const post = await Post.findById(postId);
    if (!post)
      return res
        .status(404)
        .json({ message: "Post not found", success: false });

    // $pull removes the user's ID from the likes array
    await post.updateOne({ $pull: { likes: likeKrneWalaUserKiId } });
    await post.save();

    // implement socket io for real time notification
    const user = await User.findById(likeKrneWalaUserKiId).select(
      "username profilePicture",
    );
    const postOwnerId = post.author.toString();
    if (postOwnerId !== likeKrneWalaUserKiId) {
      const notification = {
        type: "dislike",
        userId: likeKrneWalaUserKiId,
        userDetails: user,
        postId,
        message: "Your post was disliked",
      };
      const postOwnerSocketId = getReceiverSocketId(postOwnerId);
      io.to(postOwnerSocketId).emit("notification", notification);
    }

    return res.status(200).json({ message: "Post disliked", success: true });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error", success: false });
  }
};

// ADD COMMENT - creates a new comment on a post
export const addComment = async (req, res) => {
  try {
    const postId = req.params.id; // which post to comment on
    const commentKrneWalaUserKiId = req.id; // who is commenting
    const { text } = req.body; // the comment text

    const post = await Post.findById(postId);

    if (!text)
      return res
        .status(400)
        .json({ message: "text is required", success: false });

    // create the comment and immediately get the author's info
    const comment = await Comment.create({
      text,
      author: commentKrneWalaUserKiId,
      post: postId,
    });

    // populate author so the response has username and picture, not just an ID
    await comment.populate({
      path: "author",
      select: "username profilePicture",
    });

    // add the comment's ID to the post's comments array
    post.comments.push(comment._id);
    await post.save();

    // Notify post owner about the new comment (skip if commenting on own post)
    const postOwnerId = post.author.toString();
    if (postOwnerId !== commentKrneWalaUserKiId) {
      const postOwnerSocketId = getReceiverSocketId(postOwnerId);
      if (postOwnerSocketId) {
        io.to(postOwnerSocketId).emit("notification", {
          type: "comment",
          userId: commentKrneWalaUserKiId,
          userDetails: comment.author, // already populated above
          postId,
          message: `${comment.author.username} commented on your post`,
        });
      }
    }
    
    return res
      .status(201)
      .json({ message: "Comment Added", comment, success: true });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error", success: false });
  }
};

// GET COMMENTS OF POST - returns all comments for a specific post
export const getCommentsOfPost = async (req, res) => {
  try {
    const postId = req.params.id;

    // find all comments where the post field matches this postId
    const comments = await Comment.find({ post: postId }).populate(
      "author",
      "username profilePicture",
    ); // attach author info to each comment

    if (!comments)
      return res
        .status(404)
        .json({ message: "No comments found for this post", success: false });

    return res.status(200).json({ success: true, comments });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error", success: false });
  }
};

// DELETE POST - deletes a post and all its comments (only the owner can do this)
export const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const authorId = req.id;

    const post = await Post.findById(postId);
    if (!post)
      return res
        .status(404)
        .json({ message: "Post not found", success: false });

    // only the person who created the post can delete it
    // toString() is needed because MongoDB IDs are objects, not plain strings
    if (post.author.toString() !== authorId)
      return res.status(403).json({ message: "Unauthorized" });

    // delete the post from the database
    await Post.findByIdAndDelete(postId);

    // remove the post ID from the user's posts array
    let user = await User.findById(authorId);
    user.posts = user.posts.filter((id) => id.toString() !== postId);
    await user.save();

    // delete all comments that belong to this post (cleanup)
    await Comment.deleteMany({ post: postId });

    return res.status(200).json({ success: true, message: "Post deleted" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error", success: false });
  }
};

// BOOKMARK POST - saves or unsaves a post (like Instagram's save feature)
export const bookmarkPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const authorId = req.id;

    const post = await Post.findById(postId);
    if (!post)
      return res
        .status(404)
        .json({ message: "Post not found", success: false });

    const user = await User.findById(authorId);

    if (user.bookmarks.includes(post._id)) {
      // already bookmarked — remove it ($pull removes from array)
      await user.updateOne({ $pull: { bookmarks: post._id } });
      await user.save();
      return res
        .status(200)
        .json({
          type: "unsaved",
          message: "Post removed from bookmark",
          success: true,
        });
    } else {
      // not bookmarked yet — add it ($addToSet adds without duplicates)
      await user.updateOne({ $addToSet: { bookmarks: post._id } });
      await user.save();
      return res
        .status(200)
        .json({ type: "saved", message: "Post bookmarked", success: true });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error", success: false });
  }
};

export const reportPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const reportedBy = req.id;
    const { reason } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found", success: false });
    }

    if (!reason) {
      return res.status(400).json({ message: "Reason is required", success: false });
    }

    await Report.create({
      postId,
      reportedBy,
      reason,
    });

    return res.status(200).json({ message: "Post reported successfully", success: true });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error", success: false });
  }
};

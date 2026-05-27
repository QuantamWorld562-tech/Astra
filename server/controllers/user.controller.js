import { User } from "../models/user.model.js";
import bcrypt from "bcrypt"; // used to hash and compare passwords securely
import jwt from "jsonwebtoken"; // used to create and verify login tokens
import cloudinary from "../utils/cloudinary.js"; // cloud storage for images
import getDataUri from "../utils/datauri.js"; // converts image file to a string cloudinary can read
import {Post} from "../models/post.model.js";

// REGISTER - creates a new account
export const register = async (req, res) => {
  try {
    // get the values the user typed in the form
    const { username, email, password } = req.body;

    // if any field is empty, stop and send an error
    if (!username || !email || !password) {
      return res.status(401).json({
        message: " something is missing , please check! ",
        success: false,
      });
    }

    // check if someone already registered with this email
    const user = await User.findOne({ email });
    if (user) {
      return res.status(401).json({
        message: "Try another email",
        success: false,
      });
    }

    // never save plain passwords — bcrypt scrambles it (10 = how strong the scramble is)
    const hashedPassword = await bcrypt.hash(password, 10);

    // save the new user to the database
    await User.create({
      username,
      email,
      password: hashedPassword,
    });

    return res.status(201).json({
      message: " Account created successfully. ",
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

// LOGIN - checks credentials and gives the user a token
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // stop if email or password is missing
    if (!email || !password) {
      return res.status(401).json({
        message: "Something is missing, please check! ",
        success: false,
      });
    }

    // find the user by email in the database
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: "Incorrect email or password",
        success: false,
      });
    }

    // compare the typed password with the hashed one stored in DB
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        message: "Incorrect email or password",
        success: false,
      });
    }

    // build a safe user object — never send the password to the frontend
    user = {
      _id: user._id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      bio: user.bio,
      followers: user.followers,
      following: user.following,
      posts: user.posts,
    };

    // create a JWT token that contains the user's ID, expires in 1 day
    const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, {
      expiresIn: "1d",
    });

    // send the token as a cookie (httpOnly = JS can't read it, protects from attacks)
    return res
      .cookie("token", token, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 1 * 24 * 60 * 60 * 1000, // 1 day in milliseconds
      })
      .json({
        message: `Welcome back ${user.username}`,
        success: true,
        user,
      });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

// LOGOUT - clears the login token from the browser
export const logout = async (_, res) => {
  try {
    // overwrite the cookie with empty string and set expiry to 0 = deletes it
    return res.cookie("token", "", { maxAge: 0 }).json({
      message: "Logged out Successfully",
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

// GET PROFILE - returns a user's profile by their ID
export const getProfile = async (req, res) => {
  try {
    // :id comes from the URL e.g. /api/user/123/profile
    const userId = req.params.id;

    // find user but hide the password field from the result
    let user = await User.findById(userId).populate({path:'posts', options:{sort:{createdAt:-1}}}).populate('bookmarks');
    return res.status(200).json({
      user,
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

// EDIT PROFILE - updates bio, gender, or profile picture
export const editProfile = async (req, res) => {
  try {
    const userId = req.id; // comes from isAuthenticated middleware
    const { bio, gender } = req.body;
    const profilePicture = req.file; // file uploaded via multer

    let cloudResponse;
    if (profilePicture) {
      // convert the image buffer to a base64 string
      const fileUri = getDataUri(profilePicture);
      // upload to cloudinary and get back a hosted URL
      cloudResponse = await cloudinary.uploader.upload(fileUri);
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({
        message: "User not found.",
        success: false,
      });
    }

    // only update fields that were actually sent in the request
    if (bio) user.bio = bio;
    if (gender) user.gender = gender;
    if (profilePicture) user.profilePicture = cloudResponse.secure_url; // save the cloudinary URL

    await user.save(); // save changes to database

    return res.status(200).json({
      message: "Profile updated.",
      success: true,
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

// GET SUGGESTED USERS - returns all users except the logged-in one
export const getSuggestedUsers = async (req, res) => {
  try {
    // $ne means "not equal" — excludes the currently logged-in user
    const suggestedUsers = await User.find({ _id: { $ne: req.id } }).select(
      "-password", // hide passwords from all results
    );
    if (!suggestedUsers) {
      return res.status(400).json({
        message: "Currently do not have any users",
      });
    }
    return res.status(200).json({
      success: true,
      users: suggestedUsers,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

// SEARCH USERS - returns users matching a username query
export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim() === "") {
      return res.status(200).json({ success: true, users: [] });
    }
    // case-insensitive partial match on username, exclude self
    const users = await User.find({
      _id: { $ne: req.id },
      username: { $regex: query.trim(), $options: "i" },
    })
      .select("username profilePicture bio followers")
      .limit(10);

    return res.status(200).json({ success: true, users });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error", success: false });
  }
};
export const followOrUnfollow = async (req, res) => {
  try {
    const followKrneWala = req.id; // the logged-in user (who is clicking follow)
    const jiskoFollowKarunga = req.params.id; // the target user (who to follow)

    // can't follow yourself
    if (followKrneWala === jiskoFollowKarunga) {
      return res.status(400).json({
        message: "You cant follow yourself.",
        success: false,
      });
    }

    const user = await User.findById(followKrneWala);
    const targetUser = await User.findById(jiskoFollowKarunga);

    if (!user || !targetUser) {
      return res.status(400).json({
        message: "User not found",
        success: false,
      });
    }

    // check if already following
    const isFollowing = user.following.includes(jiskoFollowKarunga.toString());

    if (isFollowing) {
      // already following → unfollow
      // $pull removes the ID from the array
      // Promise.all runs both DB updates at the same time (faster)
      await Promise.all([
        User.updateOne({ _id: followKrneWala }, { $pull: { following: jiskoFollowKarunga } }),
        User.updateOne({ _id: jiskoFollowKarunga }, { $pull: { followers: followKrneWala } }),
      ]);
      return res.status(200).json({ message: "Unfollowed successfully", success: true });
    } else {
      // not following → follow
      // $push adds the ID to the array
      await Promise.all([
        User.updateOne({ _id: followKrneWala }, { $push: { following: jiskoFollowKarunga } }),
        User.updateOne({ _id: jiskoFollowKarunga }, { $push: { followers: followKrneWala } }),
      ]);
      return res.status(200).json({ message: "Followed successfully", success: true });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

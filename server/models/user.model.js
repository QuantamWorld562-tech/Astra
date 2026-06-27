import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:false, // optional — Google OAuth users don't have a password
        select: false,  // never send password to frontend by default
    },
    profilePicture:{
        type:String,
        default:''
    },
    bio:{
        type:String,
        default:''
    },
    gender:{
        type:String,
        enum:['male','female']
    },
    followers:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    }],
    following:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    }],
    posts:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Post'
    }],
    bookmarks:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Post'
    }],
    // ── Google OAuth ──────────────────────────────────────────
    // googleId is set when user signs in via Google
    // password is optional for Google users (they don't need one)
    googleId: { type: String, default: null },

    // ── OTP-based password reset ──────────────────────────────
    // resetOtp stores a hashed version of the 6-digit OTP
    resetOtp: { type: String },
    otpExpires: { type: Date },
    isOtpVerified: { type: Boolean, default: false },
    // resetPasswordToken is issued after OTP is verified — used to actually set new password
    resetPasswordToken: { type: String },
    resetPasswordExpiry: { type: Date },

    // ── Refresh Token ────────────────────────────────────────
    // Stores a bcrypt hash of the active refresh token for secure rotation
    refreshToken: { type: String },
},{timestamps:true});

export const User = mongoose.model('User',userSchema);
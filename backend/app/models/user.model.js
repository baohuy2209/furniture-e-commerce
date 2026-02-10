const mongoose = require("mongoose");
const User = mongoose.model(
  "User",
  new mongoose.Schema({
    username: { type: String, required: true, trim: true, lowercase: true },
    email: { type: String, required: true, unique: true },
    password_hash: { type: String },
    phone: { type: String, required: true },
    dob: { type: Date },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    avatar: {
      type: String,
    },
    status: {
      type: String,
      enum: ["locked", "unlocked"],
      default: "unlocked",
    },

    last_login: {
      type: Date,
    },

    is_verified: {
      type: Boolean,
      default: false,
    },

    reset_password_token: {
      type: String,
      select: false,
    },

    reset_password_token_expire_at: {
      type: Date,
      select: false,
    },

    verification_token: {
      type: String,
      select: false,
    },

    verification_token_expire_at: {
      type: Date,
      select: false,
    },
    roles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role",
      },
    ],
  }),
);
module.exports = User;

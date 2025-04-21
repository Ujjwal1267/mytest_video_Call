import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    token: { type: String, index: true }, // 🔍 Indexing for faster lookup
  },
  {
    timestamps: true, // 🕒 Adds createdAt and updatedAt fields
  }
);

// Optional: ensure index on frequently queried fields
userSchema.index({ username: 1 });

const User = mongoose.model("User", userSchema);

export { User };

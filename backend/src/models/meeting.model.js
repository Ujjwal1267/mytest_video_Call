import mongoose, { Schema } from "mongoose";

const meetingSchema = new Schema(
  {
    user_id: { type: String, required: true, index: true }, // Fast queries by user
    meetingCode: { type: String, required: true, trim: true },
    date: { type: Date, default: Date.now, required: true }
  },
  {
    timestamps: true // adds createdAt and updatedAt fields automatically
  }
);

// Optional: unique index if you want meetingCode to be unique per user
// meetingSchema.index({ user_id: 1, meetingCode: 1 }, { unique: true });

const Meeting = mongoose.model("Meeting", meetingSchema);

export { Meeting };

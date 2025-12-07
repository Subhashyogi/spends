import mongoose, { Schema, model, models } from "mongoose";

const MessageSchema = new Schema(
    {
        conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
        sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
        content: { type: String, default: "" }, // Can be empty if just sending a file
        type: {
            type: String,
            enum: ["text", "image", "video", "audio"],
            default: "text",
        },
        fileUrl: { type: String }, // For media messages
        readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    },
    { timestamps: true }
);

// Index for faster queries
MessageSchema.index({ conversationId: 1, createdAt: 1 });

console.log("Registering Message model");
const Message = models.Message || model("Message", MessageSchema);

export default Message;

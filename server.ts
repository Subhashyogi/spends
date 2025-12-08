import "dotenv/config";
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";
import connectToDatabase from "./src/lib/db";
import User from "./src/models/User";
import mongoose from "mongoose";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const httpServer = createServer(async (req, res) => {
        try {
            // Be sure to pass `true` as the second argument to `url.parse`.
            // This tells it to parse the query portion of the URL.
            const parsedUrl = parse(req.url!, true);
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error("Error occurred handling", req.url, err);
            res.statusCode = 500;
            res.end("internal server error");
        }
    });

    const io = new Server(httpServer);

    io.on("connection", (socket) => {
        console.log("Client connected", socket.id);

        socket.on("join_conversation", (roomId) => {
            socket.join(roomId);
            console.log(`User joined room: ${roomId}`);
        });

        socket.on("send_message", async (message) => {
            console.log("New message in room", message.roomId);
            console.log("Payload:", JSON.stringify(message, null, 2));

            try {
                // message contains: senderId, content, type, fileUrl, roomId, conversationId (recipientId)
                // We need to save this to the DB
                await connectToDatabase();
                console.log("DB Connected");

                const senderId = message.sender._id || message.sender;
                const recipientId = message.conversationId;

                console.log(`SenderID: ${senderId}, RecipientID: ${recipientId}`);

                if (!senderId || !recipientId) {
                    console.error("Missing sender or recipient ID");
                    return;
                }

                const newMessage = {
                    _id: new mongoose.Types.ObjectId(),
                    sender: senderId,
                    content: message.content || "",
                    type: message.type || "text",
                    fileUrl: message.fileUrl,
                    createdAt: new Date(),
                    read: false,
                    conversationId: recipientId
                };

                // Save to Sender's friends list
                const sender = await User.findById(senderId);
                const recipient = await User.findById(recipientId);

                if (!sender) console.error(`Sender not found: ${senderId}`);
                if (!recipient) console.error(`Recipient not found: ${recipientId}`);

                if (sender && recipient) {
                    // Update Sender
                    const senderFriendIndex = sender.friends.findIndex((f: any) => f.userId.toString() === recipientId);
                    if (senderFriendIndex > -1) {
                        if (!sender.friends[senderFriendIndex].messages) sender.friends[senderFriendIndex].messages = [];
                        sender.friends[senderFriendIndex].messages.push(newMessage);
                    } else {
                        sender.friends.push({
                            userId: recipient._id,
                            name: recipient.name,
                            image: recipient.avatar,
                            username: recipient.username,
                            messages: [newMessage]
                        });
                    }
                    await sender.save();
                    console.log("Saved to sender");

                    // Update Recipient
                    const recipientFriendIndex = recipient.friends.findIndex((f: any) => f.userId.toString() === senderId);
                    if (recipientFriendIndex > -1) {
                        if (!recipient.friends[recipientFriendIndex].messages) recipient.friends[recipientFriendIndex].messages = [];
                        recipient.friends[recipientFriendIndex].messages.push(newMessage);
                    } else {
                        recipient.friends.push({
                            userId: sender._id,
                            name: sender.name,
                            image: sender.avatar,
                            username: sender.username,
                            messages: [newMessage]
                        });
                    }
                    await recipient.save();
                    console.log("Saved to recipient");

                    // Broadcast the FULL saved message with the real _id and timestamp
                    const broadcastMessage = {
                        ...newMessage,
                        roomId: message.roomId,
                        sender: {
                            _id: sender._id,
                            name: sender.name,
                            image: sender.avatar
                        }
                    };

                    io.to(message.roomId).emit("receive_message", broadcastMessage);
                }
            } catch (error) {
                console.error("Socket message save error:", error);
            }
        });

        socket.on("mark_read", (data) => {
            // data = { roomId, readerId }
            // Notify the *other* user in the conversation that messages were read
            console.log(`Messages read in ${data.roomId} by ${data.readerId}`);
            io.to(data.roomId).emit("messages_read", data);
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected");
        });
    });

    httpServer
        .once("error", (err) => {
            console.error(err);
            process.exit(1);
        })
        .listen(port, () => {
            console.log(`> Ready on http://${hostname}:${port}`);
        });
});

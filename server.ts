import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";
import "./src/models"; // Register models

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

        socket.on("join_conversation", (conversationId) => {
            socket.join(conversationId);
            console.log(`User joined conversation: ${conversationId}`);
        });

        socket.on("send_message", (message) => {
            console.log("New message in", message.conversationId);
            // Broadcast to everyone in the room (including sender, though frontend handles optimistic UI)
            io.to(message.conversationId).emit("receive_message", message);
        });

        socket.on("mark_read", (data) => {
            // data = { conversationId, readerId }
            // Notify the *other* user in the conversation that messages were read
            console.log(`Messages read in ${data.conversationId} by ${data.readerId}`);
            io.to(data.conversationId).emit("messages_read", data);
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

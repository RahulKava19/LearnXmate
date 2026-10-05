const express = require("express");
require("dotenv").config();
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");

const classroomRoutes = require("./routes/ClassroomRoutes");
const userRoutes = require("./routes/userRoutes");
const documentRoutes = require("./routes/DocumentRoutes");
const projectRoutes = require("./routes/ProjectRoutes");
const submissionRoutes = require("./routes/SubmissionRoutes");
const meetingRoutes = require("./routes/MeetingRoutes");
const announcementRoutes = require("./routes/AnnouncementRoutes");

const app = express();

const PORT = process.env.PORT || 5000;

const path = require("path");


// Connect MongoDB
connectDB();


// Middleware
app.use(express.json());
app.use(cors());


// Static uploads
app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"))
);


// Test API
app.get("/api/test", (req, res) => {
    res.send("API is working!");
});


// Routes
app.use("/api/users", userRoutes);

app.use("/api/classrooms", classroomRoutes);

app.use("/api/classrooms", documentRoutes);

app.use("/api/classrooms", projectRoutes);

app.use("/api/classrooms", submissionRoutes);

app.use("/api/meetings", meetingRoutes);

app.use("/api/classrooms", announcementRoutes);


// Create HTTP server
const server = http.createServer(app);


// Create Socket.IO server
const io = new Server(server, {
    cors: {
        origin: "*"
    }
});


// =============================================
// SOCKET.IO
// =============================================

io.on("connection", (socket) => {

    console.log(
        "Socket connected:",
        socket.id
    );


    // =========================================
    // JOIN MEETING
    // =========================================

    socket.on(
        "join-meeting",
        (meetingCode) => {

            console.log(
                `${socket.id} joined meeting ${meetingCode}`
            );


            // Get users already inside the room
            const existingUsers =
                Array.from(
                    io.sockets.adapter.rooms.get(
                        meetingCode
                    ) || []
                );


            // Join the new user to the room
            socket.join(
                meetingCode
            );


            // Tell the new user about
            // users already in the room
            socket.emit(
                "existing-users",
                existingUsers
            );


            // Tell everyone else that
            // a new user joined
            socket.to(
                meetingCode
            ).emit(
                "user-joined",
                socket.id
            );

        }
    );


    // =========================================
    // WEBRTC OFFER
    // =========================================

    socket.on(
        "offer",
        ({ target, offer }) => {

            console.log(
                `Sending offer from ${socket.id} to ${target}`
            );


            io.to(target).emit(
                "offer",
                {
                    sender: socket.id,
                    offer
                }
            );

        }
    );


    // =========================================
    // WEBRTC ANSWER
    // =========================================

    socket.on(
        "answer",
        ({ target, answer }) => {

            console.log(
                `Sending answer from ${socket.id} to ${target}`
            );


            io.to(target).emit(
                "answer",
                {
                    sender: socket.id,
                    answer
                }
            );

        }
    );


    // =========================================
    // WEBRTC ICE CANDIDATE
    // =========================================

    socket.on(
        "ice-candidate",
        ({ target, candidate }) => {

            io.to(target).emit(
                "ice-candidate",
                {
                    sender: socket.id,
                    candidate
                }
            );

        }
    );


    // =========================================
    // DISCONNECT
    // =========================================

    socket.on(
        "disconnect",
        () => {

            console.log(
                "Socket disconnected:",
                socket.id
            );

        }
    );

});


// =============================================
// START SERVER
// =============================================

server.listen(
    PORT,
    () => {

        console.log(
            `Server running on http://localhost:${PORT}`
        );

    }
);
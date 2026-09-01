const express = require("express");
require("dotenv").config();

const connectDB = require("./config/db");
const classroomRoutes = require("./routes/ClassroomRoutes");
const userRoutes = require("./routes/UserRoutes");
const app = express();
const PORT = process.env.PORT || 5000;

connectDB();
app.use(express.json());
app.use("/api/users", userRoutes);
app.get("/api/test", (req, res) => {
    res.send("API is working!");
});

app.use("/api/classrooms", classroomRoutes);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
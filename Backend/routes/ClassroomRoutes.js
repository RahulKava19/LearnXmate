const express = require("express");

const router = express.Router();

const {
    createClassroom,
    joinClassroom,
    getClassrooms,
    getClassroomById,
    updateClassroom,
    deleteClassroom,
    getClassroomStudents
} = require("../controllers/ClassroomController");

const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, createClassroom);
router.post("/join", authMiddleware, joinClassroom);
router.get("/", authMiddleware, getClassrooms);
router.get("/:id", authMiddleware, getClassroomById);
router.put("/:id", authMiddleware, updateClassroom);
router.delete("/:id", authMiddleware, deleteClassroom);
router.get("/:id/students", authMiddleware, getClassroomStudents);
module.exports = router;
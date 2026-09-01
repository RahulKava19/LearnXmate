const express = require("express");

const router = express.Router();

const {
    createClassroom,
    getClassrooms,
    getClassroomById,
    updateClassroom,
    deleteClassroom
} = require("../controllers/classroomController");


const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, createClassroom);
router.get("/", authMiddleware, getClassrooms);
router.get("/:id", authMiddleware, getClassroomById);
router.put("/:id", authMiddleware, updateClassroom);
router.delete("/:id", authMiddleware, deleteClassroom);

module.exports = router;
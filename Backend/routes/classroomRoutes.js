const express = require("express");

const router = express.Router();

const {
    createClassroom,
    getClassrooms,
    getClassroomById,
    updateClassroom,
    deleteClassroom
} = require("../controllers/ClassroomController");

router.post("/", createClassroom);
router.get("/", getClassrooms);
router.get("/:id", getClassroomById);
router.put("/:id", updateClassroom);
router.delete("/:id", deleteClassroom);

module.exports = router;
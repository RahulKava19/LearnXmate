const express = require("express");

const router = express.Router();

const {
    createClassroom,
    joinClassroom,
    getClassrooms,
    getClassroomById,
    updateClassroom,
    deleteClassroom,
    getClassroomStudents,
    removeStudentFromClassroom
} = require("../controllers/ClassroomController");

const authMiddleware = require("../middleware/authMiddleware");


// CREATE CLASSROOM
router.post("/",authMiddleware,createClassroom);

// JOIN CLASSROOM
router.post("/join",authMiddleware,joinClassroom);

// GET ALL CLASSROOMS
router.get("/",authMiddleware,getClassrooms);

// GET CLASSROOM BY ID
router.get("/:id",authMiddleware,getClassroomById);

// UPDATE CLASSROOM
router.put("/:id",authMiddleware,updateClassroom);

// DELETE CLASSROOM
router.delete("/:id",authMiddleware,deleteClassroom);

// GET CLASSROOM PEOPLE
router.get("/:id/students",authMiddleware,getClassroomStudents);

// REMOVE STUDENT FROM CLASSROOM
router.delete("/:id/students/:studentId",authMiddleware,removeStudentFromClassroom);


module.exports = router;
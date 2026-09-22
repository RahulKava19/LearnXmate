const crypto = require("crypto");

const Classroom = require("../models/Classroom");
const ClassroomInstructor = require("../models/ClassroomInstructor");
const ClassroomStudent = require("../models/ClassroomStudent");


// CREATE CLASSROOM
const createClassroom = async (req, res) => {
    try {
        if (req.user.role !== "teacher") {
            return res.status(403).json({
                message: "Only instructors can create classrooms"
            });
        }

        const { id, name, description } = req.body;

        let classCode;
        let existingClassroom;

        do {
            classCode = crypto
                .randomBytes(3)
                .toString("hex")
                .toUpperCase();

            existingClassroom = await Classroom.findOne({
                classCode
            });

        } while (existingClassroom);

        const classroom = await Classroom.create({
            id,
            name,
            description,
            classCode
        });

        await ClassroomInstructor.create({
            classroom: classroom._id,
            instructor: req.user.userId
        });

        res.status(201).json(classroom);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// GET ALL CLASSROOMS
const getClassrooms = async (req, res) => {
    try {
        const classrooms = await Classroom.find();

        res.status(200).json(classrooms);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// GET CLASSROOM BY ID
const getClassroomById = async (req, res) => {
    try {
        const classroom = await Classroom.findOne({
            id: Number(req.params.id)
        });

        if (!classroom) {
            return res.status(404).json({
                message: "Classroom not found"
            });
        }

        res.status(200).json(classroom);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// UPDATE CLASSROOM
const updateClassroom = async (req, res) => {
    try {
        if (req.user.role !== "teacher") {
            return res.status(403).json({
                message: "Only instructors can update classrooms"
            });
        }

        const classroom = await Classroom.findOne({
            id: Number(req.params.id)
        });

        if (!classroom) {
            return res.status(404).json({
                message: "Classroom not found"
            });
        }

        const instructor = await ClassroomInstructor.findOne({
            classroom: classroom._id,
            instructor: req.user.userId
        });

        if (!instructor) {
            return res.status(403).json({
                message: "You are not an instructor of this classroom"
            });
        }

        classroom.name = req.body.name;
        classroom.description = req.body.description;

        await classroom.save();

        res.status(200).json(classroom);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// DELETE CLASSROOM
const deleteClassroom = async (req, res) => {
    try {
        if (req.user.role !== "teacher") {
            return res.status(403).json({
                message: "Only instructors can delete classrooms"
            });
        }

        const classroom = await Classroom.findOne({
            id: Number(req.params.id)
        });

        if (!classroom) {
            return res.status(404).json({
                message: "Classroom not found"
            });
        }

        const instructor = await ClassroomInstructor.findOne({
            classroom: classroom._id,
            instructor: req.user.userId
        });

        if (!instructor) {
            return res.status(403).json({
                message: "You are not an instructor of this classroom"
            });
        }

        await ClassroomStudent.deleteMany({
            classroom: classroom._id
        });

        await ClassroomInstructor.deleteMany({
            classroom: classroom._id
        });

        await Classroom.deleteOne({
            _id: classroom._id
        });

        res.status(200).json({
            message: "Classroom deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// JOIN CLASSROOM
const joinClassroom = async (req, res) => {
    try {
        if (req.user.role !== "student") {
            return res.status(403).json({
                message: "Only students can join classrooms"
            });
        }

        const { classCode } = req.body;

        if (!classCode) {
            return res.status(400).json({
                message: "Class code is required"
            });
        }

        const classroom = await Classroom.findOne({
            classCode: classCode.toUpperCase()
        });

        if (!classroom) {
            return res.status(404).json({
                message: "Invalid class code"
            });
        }

        const alreadyJoined = await ClassroomStudent.findOne({
            classroom: classroom._id,
            student: req.user.userId
        });

        if (alreadyJoined) {
            return res.status(400).json({
                message: "You have already joined this classroom"
            });
        }

        const classroomStudent = await ClassroomStudent.create({
            classroom: classroom._id,
            student: req.user.userId
        });

        res.status(200).json({
            message: "Classroom joined successfully",
            classroom,
            enrollment: classroomStudent
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// GET CLASSROOM STUDENTS
const getClassroomStudents = async (req, res) => {
    try {
        const classroom = await Classroom.findOne({
            id: Number(req.params.id)
        });

        if (!classroom) {
            return res.status(404).json({
                message: "Classroom not found"
            });
        }

        const students = await ClassroomStudent.find({
            classroom: classroom._id
        }).populate(
            "student",
            "name email role"
        );

        res.status(200).json({
            classroom: {
                id: classroom.id,
                name: classroom.name,
                description: classroom.description,
                classCode: classroom.classCode
            },
            students
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


module.exports = {
    createClassroom,
    getClassrooms,
    getClassroomById,
    updateClassroom,
    deleteClassroom,
    joinClassroom,
    getClassroomStudents
};
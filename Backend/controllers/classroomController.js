const Classroom = require("../models/Classroom");
const crypto = require("crypto");
const createClassroom = async (req, res) => {
    try {
        const { id, name, description } = req.body;

        if (req.user.role !== "teacher") {
            return res.status(403).json({
                message: "Only teachers can create classrooms"
            });
        }

        let classCode;
        let existingClassroom;

        do {
            classCode = crypto.randomBytes(3).toString("hex").toUpperCase();

            existingClassroom = await Classroom.findOne({
                classCode
            });
        } while (existingClassroom);

        const classroom = await Classroom.create({
            id,
            name,
            description,
            classCode,
            teacher: req.user.userId,
            students: []
        });

        res.status(201).json(classroom);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const joinClassroom = async (req, res) => {
    try {
        const { classCode } = req.body;

        if (req.user.role !== "student") {
            return res.status(403).json({
                message: "Only students can join classrooms"
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

        if (classroom.students.includes(req.user.userId)) {
            return res.status(400).json({
                message: "Student already joined this classroom"
            });
        }

        classroom.students.push(req.user.userId);

        await classroom.save();

        res.status(200).json({
            message: "Classroom joined successfully",
            classroom
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const getClassrooms = async (req, res) => {
    try {
        const classrooms = await Classroom.find().populate(
    "teacher",
    "name email"
);
        res.status(200).json(classrooms);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const getClassroomById = async (req, res) => {
    try {
        const classroom = await Classroom.findOne({
    id: req.params.id
}).populate(
    "teacher",
    "name email"
);
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

const updateClassroom = async (req, res) => {
    try {
        const classroom = await Classroom.findOneAndUpdate(
            { id: req.params.id },
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

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

const deleteClassroom = async (req, res) => {
    try {
        const classroom = await Classroom.findOneAndDelete({
            id: req.params.id
        });

        if (!classroom) {
            return res.status(404).json({
                message: "Classroom not found"
            });
        }

        res.status(200).json({
            message: "Classroom deleted successfully",
            classroom
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

module.exports = {
    createClassroom,
    joinClassroom,
    getClassrooms,
    getClassroomById,
    updateClassroom,
    deleteClassroom
};
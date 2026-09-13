const Classroom = require("../models/Classroom");
const ClassroomInstructor = require("../models/ClassroomInstructor");

const createClassroom = async (req, res) => {
    try {
        if (req.user.role !== "teacher") {
            return res.status(403).json({
                message: "Only instructors can create classrooms"
            });
        }

        const { id, name, description } = req.body;

        const classroom = await Classroom.create({
            id,
            name,
            description
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


module.exports = {
    createClassroom,
    joinClassroom,
    getClassrooms,
    getClassroomById,
    updateClassroom,
    deleteClassroom
};
const Classroom = require("../models/Classroom");

const createClassroom = async (req, res) => {
    try {
        const { id, name, description, teacher } = req.body;

        const classroom = await Classroom.create({
            id,
            name,
            description,
            teacher
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
            id: req.params.id
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
    getClassrooms,
    getClassroomById,
    updateClassroom,
    deleteClassroom
};
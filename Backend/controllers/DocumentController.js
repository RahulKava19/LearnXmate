const Document = require("../models/Document");
const Classroom = require("../models/Classroom");

const createDocument = async (req, res) => {
    try {
        const {
            id,
            title,
            content,
            attachment
        } = req.body;

        const classroomId = req.params.classroomId;

        if (req.user.role !== "teacher") {
            return res.status(403).json({
                message: "Only instructors can create documents"
            });
        }

        const Classroom = require("../models/Classroom");

        const existingClassroom = await Classroom.findById(classroomId);

        if (!existingClassroom) {
            return res.status(404).json({
                message: "Classroom not found"
            });
        }

        // Check whether logged-in instructor owns the classroom
        if (existingClassroom.teacher.toString() !== req.user.userId) {
            return res.status(403).json({
                message: "You are not the instructor of this classroom"
            });
        }
        const document = await Document.create({
            id,
            title,
            content,
            classroom: req.params.classroomId,
            instructor: req.user.userId,
            attachment
        });

        res.status(201).json(document);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const getDocuments = async (req, res) => {
    try {
        const documents = await Document.find();

        res.status(200).json(documents);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const getDocumentById = async (req, res) => {
    try {
        const document = await Document.findOne({
            id: req.params.documentId,
            classroom: req.params.classroomId
        });

        if (!document) {
            return res.status(404).json({
                message: "Document not found"
            });
        }

        res.status(200).json(document);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


const updateDocument = async (req, res) => {
    try {
        if (req.user.role !== "teacher") {
            return res.status(403).json({
                message: "Only instructors can update documents"
            });
        }

        const classroom = await Classroom.findById(
            req.params.classroomId
        );

        if (!classroom) {
            return res.status(404).json({
                message: "Classroom not found"
            });
        }

        if (classroom.teacher.toString() !== req.user.userId) {
            return res.status(403).json({
                message: "You are not the instructor of this classroom"
            });
        }

        const document = await Document.findOneAndUpdate(
            {
                id: Number(req.params.documentId),
                classroom: req.params.classroomId
            },
            {
                title: req.body.title,
                content: req.body.content,
                attachment: req.body.attachment
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!document) {
            return res.status(404).json({
                message: "Document not found"
            });
        }

        res.status(200).json(document);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const deleteDocument = async (req, res) => {
    try {
        if (req.user.role !== "teacher") {
            return res.status(403).json({
                message: "Only instructors can delete documents"
            });
        }

        const classroom = await Classroom.findById(
            req.params.classroomId
        );

        if (!classroom) {
            return res.status(404).json({
                message: "Classroom not found"
            });
        }

        if (classroom.teacher.toString() !== req.user.userId) {
            return res.status(403).json({
                message: "You are not the instructor of this classroom"
            });
        }

        const document = await Document.findOneAndDelete({
            id: req.params.documentId,
            classroom: req.params.classroomId
        });

        if (!document) {
            return res.status(404).json({
                message: "Document not found"
            });
        }

        res.status(200).json({
            message: "Document deleted successfully",
            document
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

module.exports = {
    createDocument,
    getDocuments,
    getDocumentById,
    updateDocument,
    deleteDocument
};
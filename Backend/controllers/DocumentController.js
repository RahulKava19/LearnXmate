const Document = require("../models/Document");
const Classroom = require("../models/Classroom");
const fs = require("fs");
const path = require("path");

const createDocument = async (req, res) => {
    try {
        const {
            id,
            title,
            content,
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

        const attachments = req.files
            ? req.files.map(file => ({
                fileName: file.originalname,
                fileType: file.mimetype,
                fileUrl: `/uploads/documents/${file.filename}`
            }))
            : [];

        const document = await Document.create({
            id,
            title,
            content,
            classroom: classroomId,
            instructor: req.user.userId,
            attachments
        });

        res.status(201).json(document);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const getDocumentsByClassroom = async (req, res) => {
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
                attachments: req.body.attachments
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


const addAttachments = async (req, res) => {
    try {
        if (req.user.role !== "teacher") {
            return res.status(403).json({
                message: "Only instructors can add attachments"
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

        const document = await Document.findOne({
            id: Number(req.params.documentId),
            classroom: req.params.classroomId
        });

        if (!document) {
            return res.status(404).json({
                message: "Document not found"
            });
        }

        const newAttachments = req.files.map(file => ({
            fileName: file.originalname,
            fileType: file.mimetype,
            fileUrl: `/uploads/documents/${file.filename}`
        }));

        document.attachments.push(...newAttachments);

        await document.save();

        res.status(200).json(document);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


const deleteAttachment = async (req, res) => {
    try {
        if (req.user.role !== "teacher") {
            return res.status(403).json({
                message: "Only instructors can delete attachments"
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

        if (
            classroom.teacher.toString() !==
            req.user.userId
        ) {
            return res.status(403).json({
                message: "You are not the instructor of this classroom"
            });
        }

        const document = await Document.findOne({
            id: Number(req.params.documentId),
            classroom: req.params.classroomId
        });

        if (!document) {
            return res.status(404).json({
                message: "Document not found"
            });
        }

        const attachment = document.attachments.id(
            req.params.attachmentId
        );

        if (!attachment) {
            return res.status(404).json({
                message: "Attachment not found"
            });
        }

        const filePath = path.join(
            __dirname,
            "..",
            attachment.fileUrl
        );

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        attachment.deleteOne();

        await document.save();

        res.status(200).json({
            message: "Attachment deleted successfully",
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
    getDocumentsByClassroom,
    getDocumentById,
    updateDocument,
    addAttachments,
    deleteAttachment,
    deleteDocument
};
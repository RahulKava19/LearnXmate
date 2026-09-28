const Document = require("../models/Document");
const Classroom = require("../models/Classroom");
const ClassroomInstructor = require("../models/ClassroomInstructor");
const ClassroomStudent = require("../models/ClassroomStudent");

const fs = require("fs");
const path = require("path");


// --------------------------------------------------
// CHECK CLASSROOM ACCESS
// --------------------------------------------------

const checkClassroomAccess = async (classroomId, user) => {

    const classroom = await Classroom.findById(classroomId);

    if (!classroom) {
        return {
            allowed: false,
            classroom: null,
            message: "Classroom not found"
        };
    }

    // Teacher must be an instructor
    if (user.role === "teacher") {

        const instructor = await ClassroomInstructor.findOne({
            classroom: classroom._id,
            instructor: user.userId
        });

        return {
            allowed: !!instructor,
            classroom,
            message: instructor
                ? null
                : "You are not an instructor of this classroom"
        };
    }

    // Student must be enrolled
    if (user.role === "student") {

        const student = await ClassroomStudent.findOne({
            classroom: classroom._id,
            student: user.userId
        });

        return {
            allowed: !!student,
            classroom,
            message: student
                ? null
                : "You are not a member of this classroom"
        };
    }

    return {
        allowed: false,
        classroom,
        message: "You do not have access to this classroom"
    };
};


// --------------------------------------------------
// CREATE DOCUMENT
// --------------------------------------------------

const createDocument = async (req, res) => {
    try {

        if (req.user.role !== "teacher") {
            return res.status(403).json({
                message: "Only instructors can create documents"
            });
        }

        const {
            id,
            title,
            content
        } = req.body;

        const classroomId = req.params.classroomId;

        const classroom = await Classroom.findById(classroomId);

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
            classroom: classroom._id,
            instructor: req.user.userId,
            attachments
        });

        res.status(201).json(document);

    } catch (error) {

        // Remove uploaded files if DB creation fails
        if (req.files) {

            for (const file of req.files) {

                const filePath = path.join(
                    __dirname,
                    "..",
                    "uploads",
                    "documents",
                    file.filename
                );

                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
        }

        res.status(500).json({
            message: error.message
        });
    }
};


// --------------------------------------------------
// GET DOCUMENTS BY CLASSROOM
// --------------------------------------------------

const getDocumentsByClassroom = async (req, res) => {
    try {

        const access = await checkClassroomAccess(
            req.params.classroomId,
            req.user
        );

        if (!access.classroom) {
            return res.status(404).json({
                message: access.message
            });
        }

        if (!access.allowed) {
            return res.status(403).json({
                message: access.message
            });
        }

        const documents = await Document.find({
            classroom: access.classroom._id
        });

        res.status(200).json(documents);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });
    }
};


// --------------------------------------------------
// GET DOCUMENT BY ID
// --------------------------------------------------

const getDocumentById = async (req, res) => {
    try {

        const access = await checkClassroomAccess(
            req.params.classroomId,
            req.user
        );

        if (!access.classroom) {
            return res.status(404).json({
                message: access.message
            });
        }

        if (!access.allowed) {
            return res.status(403).json({
                message: access.message
            });
        }

        const document = await Document.findOne({
            id: Number(req.params.documentId),
            classroom: access.classroom._id
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


// --------------------------------------------------
// UPDATE DOCUMENT
// --------------------------------------------------

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

        const instructor = await ClassroomInstructor.findOne({
            classroom: classroom._id,
            instructor: req.user.userId
        });

        if (!instructor) {
            return res.status(403).json({
                message: "You are not the instructor of this classroom"
            });
        }

        const document = await Document.findOneAndUpdate(
            {
                id: Number(req.params.documentId),
                classroom: classroom._id
            },
            {
                title: req.body.title,
                content: req.body.content
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


// --------------------------------------------------
// DELETE DOCUMENT
// --------------------------------------------------

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

        const instructor = await ClassroomInstructor.findOne({
            classroom: classroom._id,
            instructor: req.user.userId
        });

        if (!instructor) {
            return res.status(403).json({
                message: "You are not the instructor of this classroom"
            });
        }

        const document = await Document.findOne({
            id: Number(req.params.documentId),
            classroom: classroom._id
        });

        if (!document) {
            return res.status(404).json({
                message: "Document not found"
            });
        }

        // Delete physical files
        for (const attachment of document.attachments) {

            const relativePath = attachment.fileUrl.replace(
                /^\/+/,
                ""
            );

            const filePath = path.join(
                __dirname,
                "..",
                relativePath
            );

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await Document.deleteOne({
            _id: document._id
        });

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


// --------------------------------------------------
// ADD ATTACHMENTS
// --------------------------------------------------

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

        const instructor = await ClassroomInstructor.findOne({
            classroom: classroom._id,
            instructor: req.user.userId
        });

        if (!instructor) {
            return res.status(403).json({
                message: "You are not the instructor of this classroom"
            });
        }

        const document = await Document.findOne({
            id: Number(req.params.documentId),
            classroom: classroom._id
        });

        if (!document) {
            return res.status(404).json({
                message: "Document not found"
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                message: "No attachments provided"
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


// --------------------------------------------------
// DELETE ATTACHMENT
// --------------------------------------------------

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

        const instructor = await ClassroomInstructor.findOne({
            classroom: classroom._id,
            instructor: req.user.userId
        });

        if (!instructor) {
            return res.status(403).json({
                message: "You are not the instructor of this classroom"
            });
        }

        const document = await Document.findOne({
            id: Number(req.params.documentId),
            classroom: classroom._id
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

        const relativePath = attachment.fileUrl.replace(
            /^\/+/,
            ""
        );

        const filePath = path.join(
            __dirname,
            "..",
            relativePath
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
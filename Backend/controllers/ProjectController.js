const Project = require("../models/Project");
const Classroom = require("../models/Classroom");

const fs = require("fs");
const path = require("path");


const createProject = async (req, res) => {
    try {
        const { id, title, description, dueDate } = req.body;
        const classroomId = req.params.classroomId;

        if (req.user.role !== "teacher") {
            return res.status(403).json({
                message: "Only instructors can create projects"
            });
        }

        const classroom = await Classroom.findById(classroomId);

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

        const attachments = req.files
            ? req.files.map(file => ({
                fileName: file.originalname,
                fileType: file.mimetype,
                fileUrl: `/uploads/projects/${file.filename}`
            }))
            : [];

        const project = await Project.create({
            id,
            title,
            description,
            classroom: classroomId,
            instructor: req.user.userId,
            dueDate,
            attachments
        });

        res.status(201).json(project);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


const getProjectsByClassroom = async (req, res) => {
    try {
        const classroomId = req.params.classroomId;

        const classroom = await Classroom.findById(classroomId);

        if (!classroom) {
            return res.status(404).json({
                message: "Classroom not found"
            });
        }

        const projects = await Project.find({
            classroom: classroomId
        });

        res.status(200).json(projects);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};



const getProjectById = async (req, res) => {
    try {
        const project = await Project.findOne({
            id: Number(req.params.projectId),
            classroom: req.params.classroomId
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        res.status(200).json(project);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


const updateProject = async (req, res) => {
    try {
        if (req.user.role !== "teacher") {
            return res.status(403).json({
                message: "Only instructors can update projects"
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

        const project = await Project.findOneAndUpdate(
            {
                id: Number(req.params.projectId),
                classroom: req.params.classroomId
            },
            {
                title: req.body.title,
                description: req.body.description,
                dueDate: req.body.dueDate
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        res.status(200).json(project);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


const deleteProject = async (req, res) => {
    try {
        if (req.user.role !== "teacher") {
            return res.status(403).json({
                message: "Only instructors can delete projects"
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

        const project = await Project.findOne({
            id: Number(req.params.projectId),
            classroom: req.params.classroomId
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        for (const attachment of project.attachments) {
            const fileName = path.basename(attachment.fileUrl);

            const filePath = path.join(
                __dirname,
                "..",
                "uploads",
                "projects",
                fileName
            );

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await Project.deleteOne({
            _id: project._id
        });

        res.status(200).json({
            message: "Project deleted successfully",
            project
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

        const project = await Project.findOne({
            id: Number(req.params.projectId),
            classroom: req.params.classroomId
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        const newAttachments = req.files
            ? req.files.map(file => ({
                fileName: file.originalname,
                fileType: file.mimetype,
                fileUrl: `/uploads/projects/${file.filename}`
            }))
            : [];

        project.attachments.push(...newAttachments);

        await project.save();

        res.status(200).json(project);

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

        if (classroom.teacher.toString() !== req.user.userId) {
            return res.status(403).json({
                message: "You are not the instructor of this classroom"
            });
        }

        const project = await Project.findOne({
            id: Number(req.params.projectId),
            classroom: req.params.classroomId
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        const attachment = project.attachments.id(
            req.params.attachmentId
        );

        if (!attachment) {
            return res.status(404).json({
                message: "Attachment not found"
            });
        }

        const fileName = path.basename(
            attachment.fileUrl
        );

        const filePath = path.join(
            __dirname,
            "..",
            "uploads",
            "projects",
            fileName
        );

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        attachment.deleteOne();

        await project.save();

        res.status(200).json({
            message: "Attachment deleted successfully",
            project
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

module.exports = {
    createProject,
    getProjectsByClassroom,
    getProjectById,
    updateProject,
    deleteProject,
    addAttachments,
    deleteAttachment
};
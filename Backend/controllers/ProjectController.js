const Project = require("../models/Project");
const Classroom = require("../models/Classroom");
const ClassroomInstructor = require("../models/ClassroomInstructor");
const ClassroomStudent = require("../models/ClassroomStudent");

const uploadToCloudinary = require("../utils/cloudinaryUpload");
const cloudinary = require("../config/cloudinary");

const deleteCloudinaryFiles = async (publicIds) => {
    for (const publicId of publicIds) {
        try {
            await cloudinary.uploader.destroy(publicId, {
                resource_type: "raw"
            });
        } catch (error) {
            console.error(
                `Failed to delete Cloudinary file: ${publicId}`,
                error.message
            );
        }
    }
};

// --------------------------------------------------
// CHECK CLASSROOM ACCESS
// --------------------------------------------------

const checkClassroomAccess = async (classroomId, user) => {
    const classroom = await Classroom.findOne({
        id: Number(classroomId)
    });

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
// CREATE PROJECT
// --------------------------------------------------

const createProject = async (req, res) => {

    const uploadedPublicIds = [];

    try {

        const {
            id,
            title,
            description,
            dueDate
        } = req.body;

        if (req.user.role !== "teacher") {
            return res.status(403).json({
                message: "Only instructors can create projects"
            });
        }

        const classroom = await Classroom.findOne({
            id: Number(req.params.classroomId)
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
                message: "You are not the instructor of this classroom"
            });
        }

        const attachments = [];

        if (req.files && req.files.length > 0) {

            for (const file of req.files) {

                const uploadedFile = await uploadToCloudinary(
                    file.buffer,
                    file.originalname,
                    "projects"
                );

                uploadedPublicIds.push(uploadedFile.publicId);

                attachments.push({
                    fileName: file.originalname,
                    fileType: file.mimetype,
                    fileUrl: uploadedFile.fileUrl,
                    publicId: uploadedFile.publicId
                });
            }
        }

        const project = await Project.create({
            id,
            title,
            description,
            classroom: classroom._id,
            instructor: req.user.userId,
            dueDate,
            attachments
        });

        res.status(201).json(project);

    } catch (error) {

        await deleteCloudinaryFiles(uploadedPublicIds);

        res.status(500).json({
            message: error.message
        });
    }
};

// --------------------------------------------------
// GET PROJECTS BY CLASSROOM
// --------------------------------------------------

const getProjectsByClassroom = async (req, res) => {
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

        const projects = await Project.find({
            classroom: access.classroom._id
        });

        res.status(200).json(projects);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// --------------------------------------------------
// GET PROJECT BY ID
// --------------------------------------------------

const getProjectById = async (req, res) => {
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

        const project = await Project.findOne({
            id: Number(req.params.projectId),
            classroom: access.classroom._id
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


// --------------------------------------------------
// UPDATE PROJECT
// --------------------------------------------------

const updateProject = async (req, res) => {
    try {
        if (req.user.role !== "teacher") {
            return res.status(403).json({
                message: "Only instructors can update projects"
            });
        }

        const classroom = await Classroom.findOne({
            id: Number(req.params.classroomId)
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
                message: "You are not the instructor of this classroom"
            });
        }

        const project = await Project.findOneAndUpdate(
            {
                id: Number(req.params.projectId),
                classroom: classroom._id
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


// --------------------------------------------------
// DELETE PROJECT
// --------------------------------------------------

const deleteProject = async (req, res) => {

    try {

        if (req.user.role !== "teacher") {
            return res.status(403).json({
                message: "Only instructors can delete projects"
            });
        }

        const classroom = await Classroom.findOne({
            id: Number(req.params.classroomId)
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
                message: "You are not the instructor of this classroom"
            });
        }

        const project = await Project.findOne({
            id: Number(req.params.projectId),
            classroom: classroom._id
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        const publicIds = project.attachments
            .map(attachment => attachment.publicId)
            .filter(Boolean);

        await Project.deleteOne({
            _id: project._id
        });

        await deleteCloudinaryFiles(publicIds);

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

// --------------------------------------------------
// ADD ATTACHMENTS
// --------------------------------------------------

const addAttachments = async (req, res) => {

    const uploadedPublicIds = [];

    try {

        if (req.user.role !== "teacher") {
            return res.status(403).json({
                message: "Only instructors can add attachments"
            });
        }

        const classroom = await Classroom.findOne({
            id: Number(req.params.classroomId)
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
                message: "You are not the instructor of this classroom"
            });
        }

        const project = await Project.findOne({
            id: Number(req.params.projectId),
            classroom: classroom._id
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                message: "No attachments provided"
            });
        }

        const newAttachments = [];

        for (const file of req.files) {

            const uploadedFile = await uploadToCloudinary(
                file.buffer,
                file.originalname,
                "projects"
            );

            uploadedPublicIds.push(uploadedFile.publicId);

            newAttachments.push({
                fileName: file.originalname,
                fileType: file.mimetype,
                fileUrl: uploadedFile.fileUrl,
                publicId: uploadedFile.publicId
            });
        }

        project.attachments.push(...newAttachments);

        await project.save();

        res.status(200).json(project);

    } catch (error) {

        await deleteCloudinaryFiles(uploadedPublicIds);

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

        const classroom = await Classroom.findOne({
            id: Number(req.params.classroomId)
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
                message: "You are not the instructor of this classroom"
            });
        }

        const project = await Project.findOne({
            id: Number(req.params.projectId),
            classroom: classroom._id
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

        const publicId = attachment.publicId;

        attachment.deleteOne();

        await project.save();

        if (publicId) {
            await deleteCloudinaryFiles([publicId]);
        }

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
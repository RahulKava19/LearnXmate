const Submission = require("../models/Submission");
const Project = require("../models/Project");
const Classroom = require("../models/Classroom");
const ClassroomInstructor = require("../models/ClassroomInstructor");
const ClassroomStudents = require("../models/ClassroomStudent");

const uploadToCloudinary = require("../utils/cloudinaryUpload");
const cloudinary = require("../config/cloudinary");


// DELETE FILES FROM CLOUDINARY
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


// CREATE SUBMISSION
const createSubmission = async (req, res) => {

    const uploadedPublicIds = [];

    try {

        // Only learners can submit
        if (req.user.role !== "student") {
            return res.status(403).json({
                message: "Only learners can submit projects"
            });
        }

        const classroomId = req.params.classroomId;
        const projectId = req.params.projectId;

        // Check classroom using custom classroom ID
        const classroom = await Classroom.findOne({
            id: Number(classroomId)
        });

        if (!classroom) {
            return res.status(404).json({
                message: "Classroom not found"
            });
        }

        // Check learner belongs to classroom
        const student =
            await ClassroomStudents.findOne({
                classroom: classroom._id,
                student: req.user.userId
            });

        if (!student) {
            return res.status(403).json({
                message: "You are not a member of this classroom"
            });
        }

        // Check project
        const project = await Project.findOne({
            id: Number(projectId),
            classroom: classroom._id
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        // Check deadline
        if (project.dueDate && new Date() > project.dueDate) {
            return res.status(400).json({
                message: "The submission deadline has passed"
            });
        }

        // Check if learner already submitted
        const existingSubmission = await Submission.findOne({
            project: project._id,
            learner: req.user.userId
        });

        if (existingSubmission) {
            return res.status(400).json({
                message: "You have already submitted this project"
            });
        }

        // Submission must contain at least one file
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                message: "At least one file is required"
            });
        }

        // Upload files to Cloudinary
        const attachments = [];

        for (const file of req.files) {

            const uploadedFile = await uploadToCloudinary(
                file.buffer,
                file.originalname,
                "submissions"
            );

            uploadedPublicIds.push(uploadedFile.publicId);

            attachments.push({
                fileName: file.originalname,
                fileType: file.mimetype,
                fileUrl: uploadedFile.fileUrl,
                publicId: uploadedFile.publicId
            });
        }

        const { id } = req.body;

        const submission = await Submission.create({
            id,
            project: project._id,
            learner: req.user.userId,
            attachments
        });

        res.status(201).json(submission);

    } catch (error) {

        await deleteCloudinaryFiles(uploadedPublicIds);

        res.status(500).json({
            message: error.message
        });
    }
};


// GET ALL SUBMISSIONS FOR A PROJECT
const getProjectSubmissions = async (req, res) => {

    try {

        // Only instructors can view all submissions
        if (req.user.role !== "teacher") {
            return res.status(403).json({
                message: "Only instructors can view project submissions"
            });
        }

        const classroomId = req.params.classroomId;
        const projectId = req.params.projectId;

        // Check classroom using custom classroom ID
        const classroom = await Classroom.findOne({
            id: Number(classroomId)
        });

        if (!classroom) {
            return res.status(404).json({
                message: "Classroom not found"
            });
        }

        // Check whether instructor belongs to this classroom
        const instructor = await ClassroomInstructor.findOne({
            classroom: classroom._id,
            instructor: req.user.userId
        });

        if (!instructor) {
            return res.status(403).json({
                message: "You are not the instructor of this classroom"
            });
        }

        // Check project
        const project = await Project.findOne({
            id: Number(projectId),
            classroom: classroom._id
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        // Get all submissions
        const submissions = await Submission.find({
            project: project._id
        })
            .populate("learner", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            project: {
                id: project.id,
                title: project.title
            },
            totalSubmissions: submissions.length,
            submissions
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });
    }
};


// GET ONE SUBMISSION
const getSubmission = async (req, res) => {

    try {

        // Check classroom using custom classroom ID
        const classroom = await Classroom.findOne({
            id: Number(req.params.classroomId)
        });

        if (!classroom) {
            return res.status(404).json({
                message: "Classroom not found"
            });
        }

        // Check project
        const project = await Project.findOne({
            id: Number(req.params.projectId),
            classroom: classroom._id
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        // Find submission
        const submission = await Submission.findOne({
            id: Number(req.params.submissionId),
            project: project._id
        }).populate("learner", "name email");

        if (!submission) {
            return res.status(404).json({
                message: "Submission not found"
            });
        }

        // Student access
        if (req.user.role === "student") {

            if (
                submission.learner._id.toString() !==
                req.user.userId
            ) {
                return res.status(403).json({
                    message: "You can only view your own submission"
                });
            }

            const student =
                await ClassroomStudents.findOne({
                    classroom: classroom._id,
                    student: req.user.userId
                });

            if (!student) {
                return res.status(403).json({
                    message:
                        "You are not a member of this classroom"
                });
            }

        }

        // Teacher access
        else if (req.user.role === "teacher") {

            const instructor = await ClassroomInstructor.findOne({
                classroom: classroom._id,
                instructor: req.user.userId
            });

            if (!instructor) {
                return res.status(403).json({
                    message: "You are not the instructor of this classroom"
                });
            }

        }

        else {

            return res.status(403).json({
                message: "Access denied"
            });
        }

        res.status(200).json({
            submission,
            project: {
                id: project.id,
                title: project.title,
                dueDate: project.dueDate
            }
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });
    }
};


// ADD SUBMISSION ATTACHMENTS
const addSubmissionAttachments = async (req, res) => {

    const uploadedPublicIds = [];

    try {

        if (req.user.role !== "student") {
            return res.status(403).json({
                message: "Only learners can add submission files"
            });
        }

        // Check classroom using custom classroom ID
        const classroom = await Classroom.findOne({
            id: Number(req.params.classroomId)
        });

        if (!classroom) {
            return res.status(404).json({
                message: "Classroom not found"
            });
        }

        // Check learner belongs to classroom
        const student =
            await ClassroomStudents.findOne({
                classroom: classroom._id,
                student: req.user.userId
            });

        if (!student) {
            return res.status(403).json({
                message: "You are not a member of this classroom"
            });
        }

        // Check project
        const project = await Project.findOne({
            id: Number(req.params.projectId),
            classroom: classroom._id
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        // Check deadline
        if (project.dueDate && new Date() > project.dueDate) {
            return res.status(400).json({
                message: "The submission deadline has passed"
            });
        }

        // Find submission
        const submission = await Submission.findOne({
            id: Number(req.params.submissionId),
            project: project._id,
            learner: req.user.userId
        });

        if (!submission) {
            return res.status(404).json({
                message: "Submission not found"
            });
        }

        // At least one file required
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                message: "At least one file is required"
            });
        }

        // Maximum 10 files in one submission
        if (submission.attachments.length + req.files.length > 10) {
            return res.status(400).json({
                message: "A submission can contain maximum 10 files"
            });
        }

        // Upload files to Cloudinary
        const attachments = [];

        for (const file of req.files) {

            const uploadedFile = await uploadToCloudinary(
                file.buffer,
                file.originalname,
                "submissions"
            );

            uploadedPublicIds.push(uploadedFile.publicId);

            attachments.push({
                fileName: file.originalname,
                fileType: file.mimetype,
                fileUrl: uploadedFile.fileUrl,
                publicId: uploadedFile.publicId
            });
        }

        const updatedSubmission =
            await Submission.findOneAndUpdate(
                {
                    _id: submission._id
                },
                {
                    $push: {
                        attachments: {
                            $each: attachments
                        }
                    }
                },
                {
                    new: true,
                    runValidators: true
                }
            );

        res.status(200).json({
            message: "Attachments added successfully",
            submission: updatedSubmission
        });

    } catch (error) {

        await deleteCloudinaryFiles(uploadedPublicIds);

        res.status(500).json({
            message: error.message
        });
    }
};


// DELETE SUBMISSION ATTACHMENT
const deleteSubmissionAttachment = async (req, res) => {

    try {

        if (req.user.role !== "student") {
            return res.status(403).json({
                message: "Only learners can delete submission files"
            });
        }

        // Check classroom using custom classroom ID
        const classroom = await Classroom.findOne({
            id: Number(req.params.classroomId)
        });

        if (!classroom) {
            return res.status(404).json({
                message: "Classroom not found"
            });
        }

        // Check learner belongs to classroom
        const student =
            await ClassroomStudents.findOne({
                classroom: classroom._id,
                student: req.user.userId
            });

        if (!student) {
            return res.status(403).json({
                message:
                    "You are not a member of this classroom"
            });
        }

        // Check project
        const project = await Project.findOne({
            id: Number(req.params.projectId),
            classroom: classroom._id
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        // Check deadline
        if (project.dueDate && new Date() > project.dueDate) {
            return res.status(400).json({
                message: "The submission deadline has passed"
            });
        }

        // Find submission
        const submission = await Submission.findOne({
            id: Number(req.params.submissionId),
            project: project._id,
            learner: req.user.userId
        });

        if (!submission) {
            return res.status(404).json({
                message: "Submission not found"
            });
        }

        // Find attachment
        const attachment =
            submission.attachments.id(
                req.params.attachmentId
            );

        if (!attachment) {
            return res.status(404).json({
                message: "Attachment not found"
            });
        }

        // Store Cloudinary public ID
        const publicId = attachment.publicId;

        // Remove attachment from database
        submission.attachments.pull(
            req.params.attachmentId
        );

        await submission.save();

        // Delete file from Cloudinary
        if (publicId) {
            await deleteCloudinaryFiles([publicId]);
        }

        res.status(200).json({
            message: "Attachment deleted successfully",
            submission
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });
    }
};


// DELETE SUBMISSION
const deleteSubmission = async (req, res) => {

    try {

        if (req.user.role !== "student") {
            return res.status(403).json({
                message: "Only learners can delete submissions"
            });
        }

        // Check classroom using custom classroom ID
        const classroom = await Classroom.findOne({
            id: Number(req.params.classroomId)
        });

        if (!classroom) {
            return res.status(404).json({
                message: "Classroom not found"
            });
        }

        // Check learner belongs to classroom
        const student =
            await ClassroomStudents.findOne({
                classroom: classroom._id,
                student: req.user.userId
            });

        if (!student) {
            return res.status(403).json({
                message:
                    "You are not a member of this classroom"
            });
        }

        // Check project
        const project = await Project.findOne({
            id: Number(req.params.projectId),
            classroom: classroom._id
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        // Check deadline
        if (project.dueDate && new Date() > project.dueDate) {
            return res.status(400).json({
                message: "The submission deadline has passed"
            });
        }

        // Find submission
        const submission = await Submission.findOne({
            id: Number(req.params.submissionId),
            project: project._id,
            learner: req.user.userId
        });

        if (!submission) {
            return res.status(404).json({
                message: "Submission not found"
            });
        }

        // Get Cloudinary public IDs
        const publicIds = submission.attachments
            .map(attachment => attachment.publicId)
            .filter(Boolean);

        // Delete submission from database
        await Submission.deleteOne({
            _id: submission._id
        });

        // Delete all submission files from Cloudinary
        await deleteCloudinaryFiles(publicIds);

        res.status(200).json({
            message: "Submission deleted successfully"
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });
    }
};


module.exports = {
    createSubmission,
    getProjectSubmissions,
    getSubmission,
    addSubmissionAttachments,
    deleteSubmissionAttachment,
    deleteSubmission
};
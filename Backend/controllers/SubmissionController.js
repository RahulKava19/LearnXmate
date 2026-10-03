const Submission = require("../models/Submission");
const Project = require("../models/Project");
const Classroom = require("../models/Classroom");
const ClassroomInstructor = require("../models/ClassroomInstructor");
const ClassroomStudents = require("../models/ClassroomStudent");

const uploadToCloudinary = require("../utils/cloudinaryUpload");
const cloudinary = require("../config/cloudinary");

// =============================================
// DELETE FILES FROM CLOUDINARY
// =============================================

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

// =============================================
// CREATE SUBMISSION
// =============================================

const createSubmission = async (req, res) => {
    const uploadedPublicIds = [];

    try {
        if (req.user.role !== "student") {
            return res.status(403).json({
                message: "Only learners can submit projects"
            });
        }

        const classroomId = req.params.classroomId;
        const projectId = req.params.projectId;

        // -----------------------------------------
        // CHECK CLASSROOM
        // -----------------------------------------

        const classroom = await Classroom.findOne({
            id: Number(classroomId)
        });

        if (!classroom) {
            return res.status(404).json({
                message: "Classroom not found"
            });
        }

        // -----------------------------------------
        // CHECK STUDENT MEMBERSHIP
        // -----------------------------------------

        const student = await ClassroomStudents.findOne({
            classroom: classroom._id,
            student: req.user.userId
        });

        if (!student) {
            return res.status(403).json({
                message: "You are not a member of this classroom"
            });
        }

        // -----------------------------------------
        // CHECK PROJECT
        // -----------------------------------------

        const project = await Project.findOne({
            id: Number(projectId),
            classroom: classroom._id
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        // -----------------------------------------
        // CHECK DEADLINE
        // -----------------------------------------

        if (project.dueDate && new Date() > project.dueDate) {
            return res.status(400).json({
                message: "The submission deadline has passed"
            });
        }

        // -----------------------------------------
        // CHECK EXISTING SUBMISSION
        // -----------------------------------------

        const existingSubmission = await Submission.findOne({
            project: project._id,
            learner: req.user.userId
        });

        if (existingSubmission) {
            return res.status(400).json({
                message:
                    "You already have a submission for this project"
            });
        }

        // -----------------------------------------
        // AT LEAST ONE FILE REQUIRED
        // -----------------------------------------

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                message: "At least one file is required"
            });
        }

        // -----------------------------------------
        // MAXIMUM 10 FILES
        // -----------------------------------------

        if (req.files.length > 10) {
            return res.status(400).json({
                message: "A submission can contain maximum 10 files"
            });
        }

        // -----------------------------------------
        // GENERATE SUBMISSION ID
        // -----------------------------------------

        const lastSubmission = await Submission.findOne()
            .sort({ id: -1 })
            .select("id");

        const submissionId =
            lastSubmission ? lastSubmission.id + 1 : 1;

        // -----------------------------------------
        // UPLOAD FILES
        // -----------------------------------------

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

        // -----------------------------------------
        // CREATE SUBMISSION
        // -----------------------------------------

        const submission = await Submission.create({
            id: submissionId,
            project: project._id,
            learner: req.user.userId,
            status: "submitted",
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

// =============================================
// GET ALL SUBMISSIONS FOR A PROJECT
// =============================================

const getProjectSubmissions = async (req, res) => {
    try {
        if (req.user.role !== "teacher") {
            return res.status(403).json({
                message:
                    "Only instructors can view project submissions"
            });
        }

        // -----------------------------------------
        // CHECK CLASSROOM
        // -----------------------------------------

        const classroom = await Classroom.findOne({
            id: Number(req.params.classroomId)
        });

        if (!classroom) {
            return res.status(404).json({
                message: "Classroom not found"
            });
        }

        // -----------------------------------------
        // CHECK INSTRUCTOR
        // -----------------------------------------

        const instructor = await ClassroomInstructor.findOne({
            classroom: classroom._id,
            instructor: req.user.userId
        });

        if (!instructor) {
            return res.status(403).json({
                message: "You are not the instructor of this classroom"
            });
        }

        // -----------------------------------------
        // CHECK PROJECT
        // -----------------------------------------

        const project = await Project.findOne({
            id: Number(req.params.projectId),
            classroom: classroom._id
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        // -----------------------------------------
        // ONLY GET SUBMITTED WORK
        // -----------------------------------------

        const submissions = await Submission.find({
            project: project._id,
            $or: [
                { status: "submitted" },
                { status: { $exists: false } }
            ]
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

// =============================================
// GET ONE SUBMISSION
// =============================================

const getSubmission = async (req, res) => {
    try {
        // -----------------------------------------
        // CHECK CLASSROOM
        // -----------------------------------------

        const classroom = await Classroom.findOne({
            id: Number(req.params.classroomId)
        });

        if (!classroom) {
            return res.status(404).json({
                message: "Classroom not found"
            });
        }

        // -----------------------------------------
        // CHECK PROJECT
        // -----------------------------------------

        const project = await Project.findOne({
            id: Number(req.params.projectId),
            classroom: classroom._id
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        // -----------------------------------------
        // FIND SUBMISSION
        // -----------------------------------------

        const submission = await Submission.findOne({
            id: Number(req.params.submissionId),
            project: project._id
        }).populate("learner", "name email");

        if (!submission) {
            return res.status(404).json({
                message: "Submission not found"
            });
        }

        // -----------------------------------------
        // STUDENT ACCESS
        // -----------------------------------------

        if (req.user.role === "student") {
            if (
                submission.learner._id.toString() !==
                req.user.userId
            ) {
                return res.status(403).json({
                    message:
                        "You can only view your own submission"
                });
            }

            const student = await ClassroomStudents.findOne({
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

        // -----------------------------------------
        // TEACHER ACCESS
        // -----------------------------------------

        else if (req.user.role === "teacher") {
            const instructor =
                await ClassroomInstructor.findOne({
                    classroom: classroom._id,
                    instructor: req.user.userId
                });

            if (!instructor) {
                return res.status(403).json({
                    message:
                        "You are not the instructor of this classroom"
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

// =============================================
// ADD SUBMISSION ATTACHMENTS
// =============================================

const addSubmissionAttachments = async (req, res) => {
    const uploadedPublicIds = [];

    try {
        if (req.user.role !== "student") {
            return res.status(403).json({
                message:
                    "Only learners can add submission files"
            });
        }

        // -----------------------------------------
        // CHECK CLASSROOM
        // -----------------------------------------

        const classroom = await Classroom.findOne({
            id: Number(req.params.classroomId)
        });

        if (!classroom) {
            return res.status(404).json({
                message: "Classroom not found"
            });
        }

        // -----------------------------------------
        // CHECK STUDENT
        // -----------------------------------------

        const student = await ClassroomStudents.findOne({
            classroom: classroom._id,
            student: req.user.userId
        });

        if (!student) {
            return res.status(403).json({
                message:
                    "You are not a member of this classroom"
            });
        }

        // -----------------------------------------
        // CHECK PROJECT
        // -----------------------------------------

        const project = await Project.findOne({
            id: Number(req.params.projectId),
            classroom: classroom._id
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        // -----------------------------------------
        // CHECK DEADLINE
        // -----------------------------------------

        if (project.dueDate && new Date() > project.dueDate) {
            return res.status(400).json({
                message:
                    "The submission deadline has passed"
            });
        }

        // -----------------------------------------
        // FIND SUBMISSION
        // -----------------------------------------

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

        // -----------------------------------------
        // ONLY DRAFT CAN BE EDITED
        // -----------------------------------------

        if (submission.status === "submitted") {
            return res.status(400).json({
                message:
                    "You must unsubmit the project before adding files"
            });
        }

        // -----------------------------------------
        // CHECK FILES
        // -----------------------------------------

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                message: "At least one file is required"
            });
        }

        // -----------------------------------------
        // MAXIMUM 10 FILES
        // -----------------------------------------

        if (
            submission.attachments.length +
            req.files.length >
            10
        ) {
            return res.status(400).json({
                message:
                    "A submission can contain maximum 10 files"
            });
        }

        // -----------------------------------------
        // UPLOAD FILES
        // -----------------------------------------

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

        // -----------------------------------------
        // ADD ATTACHMENTS
        // -----------------------------------------

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

// =============================================
// DELETE SUBMISSION ATTACHMENT
// =============================================

const deleteSubmissionAttachment = async (req, res) => {
    try {
        if (req.user.role !== "student") {
            return res.status(403).json({
                message:
                    "Only learners can delete submission files"
            });
        }

        // -----------------------------------------
        // CHECK CLASSROOM
        // -----------------------------------------

        const classroom = await Classroom.findOne({
            id: Number(req.params.classroomId)
        });

        if (!classroom) {
            return res.status(404).json({
                message: "Classroom not found"
            });
        }

        // -----------------------------------------
        // CHECK STUDENT
        // -----------------------------------------

        const student = await ClassroomStudents.findOne({
            classroom: classroom._id,
            student: req.user.userId
        });

        if (!student) {
            return res.status(403).json({
                message:
                    "You are not a member of this classroom"
            });
        }

        // -----------------------------------------
        // CHECK PROJECT
        // -----------------------------------------

        const project = await Project.findOne({
            id: Number(req.params.projectId),
            classroom: classroom._id
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        // -----------------------------------------
        // CHECK DEADLINE
        // -----------------------------------------

        if (project.dueDate && new Date() > project.dueDate) {
            return res.status(400).json({
                message:
                    "The submission deadline has passed"
            });
        }

        // -----------------------------------------
        // FIND SUBMISSION
        // -----------------------------------------

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

        // -----------------------------------------
        // ONLY DRAFT CAN BE EDITED
        // -----------------------------------------

        if (submission.status === "submitted") {
            return res.status(400).json({
                message:
                    "You must unsubmit the project before deleting files"
            });
        }

        // -----------------------------------------
        // FIND ATTACHMENT
        // -----------------------------------------

        const attachment =
            submission.attachments.id(
                req.params.attachmentId
            );

        if (!attachment) {
            return res.status(404).json({
                message: "Attachment not found"
            });
        }

        const publicId = attachment.publicId;

        // -----------------------------------------
        // REMOVE ATTACHMENT
        // -----------------------------------------

        submission.attachments.pull(
            req.params.attachmentId
        );

        // -----------------------------------------
        // IF LAST FILE IS REMOVED
        // DELETE DRAFT
        // -----------------------------------------

        if (submission.attachments.length === 0) {
            await Submission.deleteOne({
                _id: submission._id
            });

            if (publicId) {
                await deleteCloudinaryFiles([publicId]);
            }

            return res.status(200).json({
                message:
                    "Last attachment deleted. You can submit the project again.",
                submission: null
            });
        }

        // -----------------------------------------
        // SAVE UPDATED SUBMISSION
        // -----------------------------------------

        await submission.save();

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

// =============================================
// UNSUBMIT PROJECT
// =============================================
//
// IMPORTANT:
// This no longer deletes the submission.
// It changes:
// submitted -> draft
//
// Existing files remain untouched.
// =============================================

const deleteSubmission = async (req, res) => {
    try {
        if (req.user.role !== "student") {
            return res.status(403).json({
                message:
                    "Only learners can unsubmit submissions"
            });
        }

        // -----------------------------------------
        // CHECK CLASSROOM
        // -----------------------------------------

        const classroom = await Classroom.findOne({
            id: Number(req.params.classroomId)
        });

        if (!classroom) {
            return res.status(404).json({
                message: "Classroom not found"
            });
        }

        // -----------------------------------------
        // CHECK STUDENT
        // -----------------------------------------

        const student = await ClassroomStudents.findOne({
            classroom: classroom._id,
            student: req.user.userId
        });

        if (!student) {
            return res.status(403).json({
                message:
                    "You are not a member of this classroom"
            });
        }

        // -----------------------------------------
        // CHECK PROJECT
        // -----------------------------------------

        const project = await Project.findOne({
            id: Number(req.params.projectId),
            classroom: classroom._id
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        // -----------------------------------------
        // CHECK DEADLINE
        // -----------------------------------------

        if (project.dueDate && new Date() > project.dueDate) {
            return res.status(400).json({
                message:
                    "The submission deadline has passed"
            });
        }

        // -----------------------------------------
        // FIND SUBMISSION
        // -----------------------------------------

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

        // -----------------------------------------
        // ALREADY DRAFT
        // -----------------------------------------

        if (submission.status === "draft") {
            return res.status(400).json({
                message:
                    "This project is already unsubmitted"
            });
        }

        // -----------------------------------------
        // CHANGE TO DRAFT
        // -----------------------------------------

        submission.status = "draft";

        await submission.save();

        // -----------------------------------------
        // KEEP ALL ATTACHMENTS
        // -----------------------------------------

        res.status(200).json({
            message:
                "Assignment unsubmitted. Your files have been kept.",
            submission
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// =============================================
// TURN IN DRAFT SUBMISSION
// =============================================
//
// draft -> submitted
//
// At least one attachment is required.
// =============================================

const submitDraft = async (req, res) => {
    try {
        if (req.user.role !== "student") {
            return res.status(403).json({
                message:
                    "Only learners can submit projects"
            });
        }

        // -----------------------------------------
        // CHECK CLASSROOM
        // -----------------------------------------

        const classroom = await Classroom.findOne({
            id: Number(req.params.classroomId)
        });

        if (!classroom) {
            return res.status(404).json({
                message: "Classroom not found"
            });
        }

        // -----------------------------------------
        // CHECK STUDENT
        // -----------------------------------------

        const student = await ClassroomStudents.findOne({
            classroom: classroom._id,
            student: req.user.userId
        });

        if (!student) {
            return res.status(403).json({
                message:
                    "You are not a member of this classroom"
            });
        }

        // -----------------------------------------
        // CHECK PROJECT
        // -----------------------------------------

        const project = await Project.findOne({
            id: Number(req.params.projectId),
            classroom: classroom._id
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        // -----------------------------------------
        // CHECK DEADLINE
        // -----------------------------------------

        if (project.dueDate && new Date() > project.dueDate) {
            return res.status(400).json({
                message:
                    "The submission deadline has passed"
            });
        }

        // -----------------------------------------
        // FIND SUBMISSION
        // -----------------------------------------

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

        // -----------------------------------------
        // CHECK STATUS
        // -----------------------------------------

        if (submission.status === "submitted") {
            return res.status(400).json({
                message:
                    "This project has already been submitted"
            });
        }

        // -----------------------------------------
        // AT LEAST ONE FILE REQUIRED
        // -----------------------------------------

        if (
            !submission.attachments ||
            submission.attachments.length === 0
        ) {
            return res.status(400).json({
                message:
                    "At least one file is required before turning in the project"
            });
        }

        // -----------------------------------------
        // TURN IN
        // -----------------------------------------

        submission.status = "submitted";

        await submission.save();

        res.status(200).json({
            message:
                "Assignment turned in successfully.",
            submission
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// =============================================
// GET MY SUBMISSION FOR A PROJECT
// =============================================

const getMySubmission = async (req, res) => {
    try {
        if (req.user.role !== "student") {
            return res.status(403).json({
                message:
                    "Only learners can access their submission"
            });
        }

        // -----------------------------------------
        // CHECK CLASSROOM
        // -----------------------------------------

        const classroom = await Classroom.findOne({
            id: Number(req.params.classroomId)
        });

        if (!classroom) {
            return res.status(404).json({
                message: "Classroom not found"
            });
        }

        // -----------------------------------------
        // CHECK STUDENT
        // -----------------------------------------

        const student = await ClassroomStudents.findOne({
            classroom: classroom._id,
            student: req.user.userId
        });

        if (!student) {
            return res.status(403).json({
                message:
                    "You are not a member of this classroom"
            });
        }

        // -----------------------------------------
        // CHECK PROJECT
        // -----------------------------------------

        const project = await Project.findOne({
            id: Number(req.params.projectId),
            classroom: classroom._id
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        // -----------------------------------------
        // FIND SUBMISSION
        // -----------------------------------------

        const submission = await Submission.findOne({
            project: project._id,
            learner: req.user.userId
        });

        if (!submission) {
            return res.status(404).json({
                message: "Submission not found"
            });
        }

        res.status(200).json(submission);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// =============================================
// EXPORTS
// =============================================

module.exports = {
    createSubmission,
    getProjectSubmissions,
    getSubmission,
    addSubmissionAttachments,
    deleteSubmissionAttachment,
    deleteSubmission,
    submitDraft,
    getMySubmission
};
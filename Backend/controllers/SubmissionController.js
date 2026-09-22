const Submission = require("../models/Submission");
const Project = require("../models/Project");
const Classroom = require("../models/Classroom");
const ClassroomInstructor = require("../models/ClassroomInstructor");


const fs = require("fs");
const path = require("path");


// CREATE SUBMISSION
const createSubmission = async (req, res) => {
    try {

        // Only learners can submit
        if (req.user.role !== "student") {
            return res.status(403).json({
                message: "Only learners can submit projects"
            });
        }

        const classroomId = req.params.classroomId;
        const projectId = req.params.projectId;

        // Check classroom
        const classroom = await Classroom.findById(classroomId);

        if (!classroom) {
            return res.status(404).json({
                message: "Classroom not found"
            });
        }

        // Check learner belongs to classroom
        const isStudent = classroom.students.some(
            studentId =>
                studentId.toString() === req.user.userId
        );

        if (!isStudent) {
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

        // Create attachment information
        const attachments = req.files.map(file => ({
            fileName: file.originalname,
            fileType: file.mimetype,
            fileUrl: `/uploads/submissions/${file.filename}`
        }));

        const { id } = req.body;

        const submission = await Submission.create({
            id,
            project: project._id,
            learner: req.user.userId,
            attachments
        });

        res.status(201).json(submission);

    } catch (error) {

        // If database creation fails after files were uploaded,
        // remove those physical files.
        if (req.files) {
            for (const file of req.files) {
                const filePath = path.join(
                    __dirname,
                    "..",
                    "uploads",
                    "submissions",
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

        // Check classroom
        const classroom = await Classroom.findById(classroomId);

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
            .populate("learner", "name email")  // populate will fetch the details of whole learner object 
            .sort({ createdAt: -1 }); // Here we specified to fetch only name , email 

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
        const classroom = await Classroom.findById(
            req.params.classroomId
        );

        if (!classroom) {
            return res.status(404).json({
                message: "Classroom not found"
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

        const submission = await Submission.findOne({
            id: Number(req.params.submissionId),
            project: project._id
        }).populate("learner", "name email");

        if (!submission) {
            return res.status(404).json({
                message: "Submission not found"
            });
        }

        if (req.user.role === "student") {
            if (
                submission.learner._id.toString() !==
                req.user.userId
            ) {
                return res.status(403).json({
                    message: "You can only view your own submission"
                });
            }
        } else if (req.user.role === "teacher") {
            const instructor = await ClassroomInstructor.findOne({
                classroom: classroom._id,
                instructor: req.user.userId
            });

            if (!instructor) {
                return res.status(403).json({
                    message: "You are not the instructor of this classroom"
                });
            }
        } else {
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
    try {
        if (req.user.role !== "student") {
            return res.status(403).json({
                message: "Only learners can add submission files"
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

        const isStudent = classroom.students.some(
            studentId =>
                studentId.toString() === req.user.userId
        );

        if (!isStudent) {
            return res.status(403).json({
                message: "You are not a member of this classroom"
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

        if (project.dueDate && new Date() > project.dueDate) {
            return res.status(400).json({
                message: "The submission deadline has passed"
            });
        }

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

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                message: "At least one file is required"
            });
        }

        if (submission.attachments.length + req.files.length > 10) {
            for (const file of req.files) {
                const filePath = path.join(
                    __dirname,
                    "..",
                    "uploads",
                    "submissions",
                    file.filename
                );

                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }

            return res.status(400).json({
                message: "A submission can contain maximum 10 files"
            });
        }

        const attachments = req.files.map(file => ({
            fileName: file.originalname,
            fileType: file.mimetype,
            fileUrl: `/uploads/submissions/${file.filename}`
        }));

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
        if (req.files) {
            for (const file of req.files) {
                const filePath = path.join(
                    __dirname,
                    "..",
                    "uploads",
                    "submissions",
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

// DELETE SUBMISSION ATTACHMENT
const deleteSubmissionAttachment = async (req, res) => {
    try {
        if (req.user.role !== "student") {
            return res.status(403).json({
                message: "Only learners can delete submission files"
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

        const isStudent = classroom.students.some(
            studentId =>
                studentId.toString() === req.user.userId
        );

        if (!isStudent) {
            return res.status(403).json({
                message: "You are not a member of this classroom"
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

        if (project.dueDate && new Date() > project.dueDate) {
            return res.status(400).json({
                message: "The submission deadline has passed"
            });
        }

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

        const attachment = submission.attachments.id(
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
            "uploads",
            "submissions",
            path.basename(attachment.fileUrl)
        );

        submission.attachments.pull(
            req.params.attachmentId
        );

        await submission.save();

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
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

        const classroom = await Classroom.findById(
            req.params.classroomId
        );

        if (!classroom) {
            return res.status(404).json({
                message: "Classroom not found"
            });
        }

        const isStudent = classroom.students.some(
            studentId =>
                studentId.toString() === req.user.userId
        );

        if (!isStudent) {
            return res.status(403).json({
                message: "You are not a member of this classroom"
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

        if (project.dueDate && new Date() > project.dueDate) {
            return res.status(400).json({
                message: "The submission deadline has passed"
            });
        }

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

        const filePaths = submission.attachments.map(
            attachment =>
                path.join(
                    __dirname,
                    "..",
                    "uploads",
                    "submissions",
                    path.basename(attachment.fileUrl)
                )
        );

        await Submission.deleteOne({
            _id: submission._id
        });

        for (const filePath of filePaths) {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

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
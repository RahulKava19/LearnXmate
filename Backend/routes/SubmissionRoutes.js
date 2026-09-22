const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const createUploadMiddleware = require("../middleware/uploadMiddleware");

const {
    createSubmission,
    getProjectSubmissions,
    getSubmission,
    addSubmissionAttachments,
    deleteSubmissionAttachment,
    deleteSubmission
} = require("../controllers/SubmissionController");

const uploadSubmission =
    createUploadMiddleware("submissions");

// CREATE SUBMISSION
router.post(
    "/:classroomId/projects/:projectId/submissions",
    authMiddleware,
    uploadSubmission.array("attachments", 10),
    createSubmission
);

// GET ALL SUBMISSIONS
router.get(
    "/:classroomId/projects/:projectId/submissions",
    authMiddleware,
    getProjectSubmissions
);

// GET ONE SUBMISSION
router.get(
    "/:classroomId/projects/:projectId/submissions/:submissionId",
    authMiddleware,
    getSubmission
);

// ADD SUBMISSION ATTACHMENTS
router.post(
    "/:classroomId/projects/:projectId/submissions/:submissionId/attachments",
    authMiddleware,
    uploadSubmission.array("attachments", 10),
    addSubmissionAttachments
);

// DELETE SUBMISSION ATTACHMENT
router.delete(
    "/:classroomId/projects/:projectId/submissions/:submissionId/attachments/:attachmentId",
    authMiddleware,
    deleteSubmissionAttachment
);

// DELETE SUBMISSION
router.delete(
    "/:classroomId/projects/:projectId/submissions/:submissionId",
    authMiddleware,
    deleteSubmission
);

module.exports = router;
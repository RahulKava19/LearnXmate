const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const createUploadMiddleware = require("../middleware/uploadMiddleware");

const uploadProject = createUploadMiddleware("projects");

const {
    createProject,
    getProjectsByClassroom,
    getProjectById,
    updateProject,
    addAttachments,
    deleteAttachment,
    deleteProject
} = require("../controllers/ProjectController");


router.post(
    "/:classroomId/projects",
    authMiddleware,
    uploadProject.array("attachments", 10),
    createProject
);


router.get(
    "/:classroomId/projects",
    authMiddleware,
    getProjectsByClassroom
);


router.get(
    "/:classroomId/projects/:projectId",
    authMiddleware,
    getProjectById
);


router.put(
    "/:classroomId/projects/:projectId",
    authMiddleware,
    updateProject
);


router.post(
    "/:classroomId/projects/:projectId/attachments",
    authMiddleware,
    uploadProject.array("attachments", 10),
    addAttachments
);


router.delete(
    "/:classroomId/projects/:projectId/attachments/:attachmentId",
    authMiddleware,
    deleteAttachment
);


router.delete(
    "/:classroomId/projects/:projectId",
    authMiddleware,
    deleteProject
);


module.exports = router;
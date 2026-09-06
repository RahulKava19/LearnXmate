const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const uploadDocument = require("../middleware/uploadMiddleware");

const {
    createDocument,
    getDocumentsByClassroom,
    getDocumentById,
    updateDocument,
    addAttachments,
    deleteAttachment,
    deleteDocument
} = require("../controllers/DocumentController");

router.post(
    "/:classroomId/documents", 
    authMiddleware, uploadDocument.array("attachments"),
    createDocument
);

router.get("/:classroomId/documents", authMiddleware, getDocumentsByClassroom);

router.get("/:classroomId/documents/:documentId", authMiddleware,  getDocumentById);

router.put("/:classroomId/documents/:documentId", authMiddleware, updateDocument);

router.post(
    "/:classroomId/documents/:documentId/attachments",
    authMiddleware,
    uploadDocument.array("attachments", 10),
    addAttachments
);

router.delete(
    "/:classroomId/documents/:documentId/attachments/:attachmentId",
    authMiddleware,
    deleteAttachment
);

router.delete("/:classroomId/documents/:documentId", authMiddleware, deleteDocument);

module.exports = router;
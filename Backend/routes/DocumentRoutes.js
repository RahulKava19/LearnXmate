const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    createDocument,
    getDocuments,
    getDocumentById,
    updateDocument,
    deleteDocument
} = require("../controllers/DocumentController");

router.post("/:classroomId/documents", authMiddleware, createDocument);

router.get("/:classroomId/documents", authMiddleware, getDocuments);

router.get("/:classroomId/documents/:documentId", authMiddleware,  getDocumentById);

router.put("/:classroomId/documents/:documentId", authMiddleware, updateDocument);

router.delete("/:classroomId/documents/:documentId", authMiddleware, deleteDocument);

module.exports = router;
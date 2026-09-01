const express = require("express");

const router = express.Router();

const {
    createDocument,
    getDocuments,
    getDocumentById,
    getDocumentsByClassroom,
    updateDocument,
    deleteDocument
} = require("../controllers/DocumentController");

router.post("/", createDocument);

router.get("/", getDocuments);

router.get("/classroom/:classroomId", getDocumentsByClassroom);

router.get("/:id", getDocumentById);

router.put("/:id", updateDocument);

router.delete("/:id", deleteDocument);

module.exports = router;
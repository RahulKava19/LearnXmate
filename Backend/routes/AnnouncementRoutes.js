const express = require("express");

const router = express.Router();

const authMiddleware =
    require("../middleware/authMiddleware");

const {
    createAnnouncement,
    getAnnouncementsByClassroom,
    updateAnnouncement,
    deleteAnnouncement
} = require("../controllers/AnnouncementController");


// =====================================================
// CREATE
// =====================================================

router.post(
    "/:classroomId/announcements",
    authMiddleware,
    createAnnouncement
);


// =====================================================
// GET
// =====================================================

router.get(
    "/:classroomId/announcements",
    authMiddleware,
    getAnnouncementsByClassroom
);


// =====================================================
// UPDATE
// =====================================================

router.put(
    "/:classroomId/announcements/:announcementId",
    authMiddleware,
    updateAnnouncement
);


// =====================================================
// DELETE
// =====================================================

router.delete(
    "/:classroomId/announcements/:announcementId",
    authMiddleware,
    deleteAnnouncement
);


module.exports = router;
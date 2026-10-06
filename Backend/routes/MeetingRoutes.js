const express = require("express");

const router = express.Router();

const {
    createMeeting,
    getAllMeetings,
    getMeetingByCode,
    joinMeeting,
    leaveMeeting,
    getClassroomMeetings,
    getMeetingParticipants,
    endMeeting
} = require("../controllers/MeetingController");

const authMiddleware = require("../middleware/authMiddleware");


// =============================================
// CREATE MEETING
// =============================================

router.post(
    "/",
    authMiddleware,
    createMeeting
);


// =============================================
// GET ALL MEETINGS FOR CURRENT USER
// =============================================

router.get(
    "/",
    authMiddleware,
    getAllMeetings
);


// =============================================
// JOIN MEETING
// =============================================

router.post(
    "/join",
    authMiddleware,
    joinMeeting
);


// =============================================
// GET MEETING BY CODE
// =============================================

router.get(
    "/code/:meetingCode",
    authMiddleware,
    getMeetingByCode
);


// =============================================
// GET CLASSROOM MEETINGS
// =============================================

router.get(
    "/classroom/:classroomId",
    authMiddleware,
    getClassroomMeetings
);


// =============================================
// GET PARTICIPANTS
// =============================================

router.get(
    "/:id/participants",
    authMiddleware,
    getMeetingParticipants
);


// =============================================
// LEAVE MEETING
// =============================================

router.post(
    "/:id/leave",
    authMiddleware,
    leaveMeeting
);


// =============================================
// END MEETING
// =============================================

router.put(
    "/:id/end",
    authMiddleware,
    endMeeting
);


module.exports = router;
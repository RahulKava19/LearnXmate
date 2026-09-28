const express = require("express");

const router = express.Router();

const {
    createMeeting,
    getMeetingByCode,
    joinMeeting,
    leaveMeeting,
    getClassroomMeetings,
    getMeetingParticipants,
    endMeeting
} = require("../controllers/MeetingController");

const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, createMeeting);

router.post("/join", authMiddleware, joinMeeting);

router.get(
    "/code/:meetingCode",
    authMiddleware,
    getMeetingByCode
);

router.get(
    "/classroom/:classroomId",
    authMiddleware,
    getClassroomMeetings
);

router.get(
    "/:id/participants",
    authMiddleware,
    getMeetingParticipants
);

router.post(
    "/:id/leave",
    authMiddleware,
    leaveMeeting
);

router.put(
    "/:id/end",
    authMiddleware,
    endMeeting
);

module.exports = router;
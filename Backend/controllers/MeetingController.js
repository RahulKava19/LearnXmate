const crypto = require("crypto");

const Meeting = require("../models/Meeting");
const Classroom = require("../models/Classroom");
const ClassroomInstructor = require("../models/ClassroomInstructor");
const ClassroomStudent = require("../models/ClassroomStudent");
const MeetingParticipant = require("../models/MeetingParticipant");

// CREATE MEETING
const createMeeting = async (req, res) => {
    try {
        if (req.user.role !== "teacher") {
            return res.status(403).json({
                message: "Only instructors can create meetings"
            });
        }

        const { title, classroomId, scheduledAt } = req.body;

        if (!title || !classroomId) {
            return res.status(400).json({
                message: "Title and classroomId are required"
            });
        }

        const classroom = await Classroom.findById(classroomId);

        if (!classroom) {
            return res.status(404).json({
                message: "Classroom not found"
            });
        }

        // Check whether this teacher is an instructor
        const instructor = await ClassroomInstructor.findOne({
            classroom: classroom._id,
            instructor: req.user.userId
        });

        if (!instructor) {
            return res.status(403).json({
                message: "You are not an instructor of this classroom"
            });
        }

        // Generate unique meeting code
        let meetingCode;
        let existingMeeting;

        do {
            meetingCode = crypto
                .randomBytes(4)
                .toString("hex")
                .toUpperCase();

            existingMeeting = await Meeting.findOne({
                meetingCode
            });

        } while (existingMeeting);

        const meeting = await Meeting.create({
            title,
            classroom: classroom._id,
            instructor: req.user.userId,
            meetingCode,
            scheduledAt
        });

        res.status(201).json({
            message: "Meeting created successfully",
            meeting
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// GET MEETING BY CODE
const getMeetingByCode = async (req, res) => {
    try {
        const meeting = await Meeting.findOne({
            meetingCode: req.params.meetingCode.toUpperCase()
        })
            .populate("classroom", "id name description")
            .populate("instructor", "name email");

        if (!meeting) {
            return res.status(404).json({
                message: "Meeting not found"
            });
        }

        res.status(200).json(meeting);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// JOIN MEETING
const joinMeeting = async (req, res) => {
    try {
        const { meetingCode } = req.body;

        if (!meetingCode) {
            return res.status(400).json({
                message: "Meeting code is required"
            });
        }

        const meeting = await Meeting.findOne({
            meetingCode: meetingCode.toUpperCase()
        });

        if (!meeting) {
            return res.status(404).json({
                message: "Invalid meeting code"
            });
        }

        if (meeting.status === "ended") {
            return res.status(400).json({
                message: "Meeting has already ended"
            });
        }

        // Teacher/instructor
        if (
            req.user.role === "teacher" &&
            meeting.instructor.toString() === req.user.userId.toString()
        ) {
            let participant = await MeetingParticipant.findOne({
                meeting: meeting._id,
                user: req.user.userId
            });

            if (!participant) {
                participant = await MeetingParticipant.create({
                    meeting: meeting._id,
                    user: req.user.userId
                });
            } else {
                participant.leftAt = null;
                participant.joinedAt = new Date();
                await participant.save();
            }

            return res.status(200).json({
                message: "Meeting joined successfully",
                meeting,
                participant
            });
        }

        // Student must belong to classroom
        if (req.user.role !== "student") {
            return res.status(403).json({
                message: "Only instructors and students can join meetings"
            });
        }

        const classroomStudent = await ClassroomStudent.findOne({
            classroom: meeting.classroom,
            student: req.user.userId
        });

        if (!classroomStudent) {
            return res.status(403).json({
                message: "You are not a member of this classroom"
            });
        }

        let participant = await MeetingParticipant.findOne({
            meeting: meeting._id,
            user: req.user.userId
        });

        if (!participant) {
            participant = await MeetingParticipant.create({
                meeting: meeting._id,
                user: req.user.userId
            });
        } else {
            participant.leftAt = null;
            participant.joinedAt = new Date();
            await participant.save();
        }

        res.status(200).json({
            message: "Meeting joined successfully",
            meeting,
            participant
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// GET CLASSROOM MEETINGS
const getClassroomMeetings = async (req, res) => {
    try {
        const classroom = await Classroom.findOne({
            id: Number(req.params.classroomId)
        });

        if (!classroom) {
            return res.status(404).json({
                message: "Classroom not found"
            });
        }

        const meetings = await Meeting.find({
            classroom: classroom._id
        })
            .populate("instructor", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json(meetings);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const leaveMeeting = async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.id);

        if (!meeting) {
            return res.status(404).json({
                message: "Meeting not found"
            });
        }

        const participant = await MeetingParticipant.findOne({
            meeting: meeting._id,
            user: req.user.userId
        });

        if (!participant) {
            return res.status(404).json({
                message: "You are not a participant of this meeting"
            });
        }

        participant.leftAt = new Date();

        await participant.save();

        res.status(200).json({
            message: "Meeting left successfully",
            participant
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// END MEETING
const endMeeting = async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.id);

        if (!meeting) {
            return res.status(404).json({
                message: "Meeting not found"
            });
        }

        if (
            meeting.instructor.toString() !==
            req.user.userId.toString()
        ) {
            return res.status(403).json({
                message: "You are not the instructor of this meeting"
            });
        }

        meeting.status = "ended";

        await meeting.save();

        res.status(200).json({
            message: "Meeting ended successfully",
            meeting
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const getMeetingParticipants = async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.id);

        if (!meeting) {
            return res.status(404).json({
                message: "Meeting not found"
            });
        }

        // Only the instructor of this meeting can view participants
        if (
            meeting.instructor.toString() !==
            req.user.userId.toString()
        ) {
            return res.status(403).json({
                message: "Only the meeting instructor can view participants"
            });
        }

        const participants = await MeetingParticipant.find({
            meeting: meeting._id
        })
            .populate("user", "name email role")
            .sort({ joinedAt: 1 });

        res.status(200).json({
            meetingId: meeting._id,
            meetingCode: meeting.meetingCode,
            participants
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

module.exports = {
    createMeeting,
    getMeetingByCode,
    joinMeeting,
    leaveMeeting,
    getClassroomMeetings,
    getMeetingParticipants,
    endMeeting
};
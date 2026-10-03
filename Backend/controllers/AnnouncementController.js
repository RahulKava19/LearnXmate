const Announcement = require("../models/Announcement");
const Classroom = require("../models/Classroom");
const ClassroomInstructor = require("../models/ClassroomInstructor");
const ClassroomStudent = require("../models/ClassroomStudent");


// =====================================================
// CHECK CLASSROOM ACCESS
// =====================================================

const checkClassroomAccess = async (
    classroomId,
    user
) => {

    const classroom = await Classroom.findOne({
        id: Number(classroomId)
    });


    if (!classroom) {

        return {
            allowed: false,
            classroom: null,
            message: "Classroom not found"
        };

    }


    // Teacher
    if (user.role === "teacher") {

        const instructor =
            await ClassroomInstructor.findOne({
                classroom: classroom._id,
                instructor: user.userId
            });


        return {
            allowed: !!instructor,
            classroom,
            message: instructor
                ? null
                : "You are not an instructor of this classroom"
        };

    }


    // Student
    if (user.role === "student") {

        const student =
            await ClassroomStudent.findOne({
                classroom: classroom._id,
                student: user.userId
            });


        return {
            allowed: !!student,
            classroom,
            message: student
                ? null
                : "You are not a member of this classroom"
        };

    }


    return {
        allowed: false,
        classroom,
        message: "You do not have access to this classroom"
    };
};


// =====================================================
// CREATE ANNOUNCEMENT
// =====================================================

const createAnnouncement = async (req, res) => {

    try {

        if (req.user.role !== "teacher") {

            return res.status(403).json({
                message:
                    "Only instructors can create announcements"
            });

        }


        const {
            title,
            content
        } = req.body;


        if (!title || !title.trim()) {

            return res.status(400).json({
                message:
                    "Announcement title is required"
            });

        }


        if (!content || !content.trim()) {

            return res.status(400).json({
                message:
                    "Announcement content is required"
            });

        }


        const classroom =
            await Classroom.findOne({
                id: Number(req.params.classroomId)
            });


        if (!classroom) {

            return res.status(404).json({
                message: "Classroom not found"
            });

        }


        const instructor =
            await ClassroomInstructor.findOne({
                classroom: classroom._id,
                instructor: req.user.userId
            });


        if (!instructor) {

            return res.status(403).json({
                message:
                    "You are not the instructor of this classroom"
            });

        }


        const announcement =
            await Announcement.create({

                title: title.trim(),

                content: content.trim(),

                classroom: classroom._id,

                instructor: req.user.userId

            });


        const populatedAnnouncement =
            await Announcement.findById(
                announcement._id
            ).populate(
                "instructor",
                "name email"
            );


        res.status(201).json(
            populatedAnnouncement
        );


    } catch (error) {

        console.error(
            "Create announcement error:",
            error
        );

        res.status(500).json({
            message: error.message
        });

    }
};


// =====================================================
// GET ANNOUNCEMENTS
// =====================================================

const getAnnouncementsByClassroom =
    async (req, res) => {

        try {

            const access =
                await checkClassroomAccess(
                    req.params.classroomId,
                    req.user
                );


            if (!access.classroom) {

                return res.status(404).json({
                    message: access.message
                });

            }


            if (!access.allowed) {

                return res.status(403).json({
                    message: access.message
                });

            }


            const announcements =
                await Announcement.find({
                    classroom:
                        access.classroom._id
                })
                .populate(
                    "instructor",
                    "name email"
                )
                .sort({
                    createdAt: -1
                });


            res.status(200).json(
                announcements
            );


        } catch (error) {

            console.error(
                "Get announcements error:",
                error
            );

            res.status(500).json({
                message: error.message
            });

        }
    };


// =====================================================
// UPDATE ANNOUNCEMENT
// =====================================================

const updateAnnouncement = async (req, res) => {

    try {

        if (req.user.role !== "teacher") {

            return res.status(403).json({
                message:
                    "Only instructors can update announcements"
            });

        }


        const {
            title,
            content
        } = req.body;


        if (!title || !title.trim()) {

            return res.status(400).json({
                message:
                    "Announcement title is required"
            });

        }


        if (!content || !content.trim()) {

            return res.status(400).json({
                message:
                    "Announcement content is required"
            });

        }


        const classroom =
            await Classroom.findOne({
                id: Number(req.params.classroomId)
            });


        if (!classroom) {

            return res.status(404).json({
                message: "Classroom not found"
            });

        }


        // Make sure teacher owns this classroom
        const instructor =
            await ClassroomInstructor.findOne({
                classroom: classroom._id,
                instructor: req.user.userId
            });


        if (!instructor) {

            return res.status(403).json({
                message:
                    "You are not the instructor of this classroom"
            });

        }


        const announcement =
            await Announcement.findOne({
                _id: req.params.announcementId,
                classroom: classroom._id,
                instructor: req.user.userId
            });


        if (!announcement) {

            return res.status(404).json({
                message:
                    "Announcement not found"
            });

        }


        announcement.title =
            title.trim();

        announcement.content =
            content.trim();


        await announcement.save();


        const updatedAnnouncement =
            await Announcement.findById(
                announcement._id
            ).populate(
                "instructor",
                "name email"
            );


        res.status(200).json(
            updatedAnnouncement
        );


    } catch (error) {

        console.error(
            "Update announcement error:",
            error
        );

        res.status(500).json({
            message: error.message
        });

    }
};


// =====================================================
// DELETE ANNOUNCEMENT
// =====================================================

const deleteAnnouncement = async (req, res) => {

    try {

        if (req.user.role !== "teacher") {

            return res.status(403).json({
                message:
                    "Only instructors can delete announcements"
            });

        }


        const classroom =
            await Classroom.findOne({
                id: Number(req.params.classroomId)
            });


        if (!classroom) {

            return res.status(404).json({
                message: "Classroom not found"
            });

        }


        // Make sure teacher owns this classroom
        const instructor =
            await ClassroomInstructor.findOne({
                classroom: classroom._id,
                instructor: req.user.userId
            });


        if (!instructor) {

            return res.status(403).json({
                message:
                    "You are not the instructor of this classroom"
            });

        }


        const announcement =
            await Announcement.findOneAndDelete({
                _id: req.params.announcementId,
                classroom: classroom._id,
                instructor: req.user.userId
            });


        if (!announcement) {

            return res.status(404).json({
                message:
                    "Announcement not found"
            });

        }


        res.status(200).json({
            message:
                "Announcement deleted successfully"
        });


    } catch (error) {

        console.error(
            "Delete announcement error:",
            error
        );

        res.status(500).json({
            message: error.message
        });

    }
};


module.exports = {
    createAnnouncement,
    getAnnouncementsByClassroom,
    updateAnnouncement,
    deleteAnnouncement
};
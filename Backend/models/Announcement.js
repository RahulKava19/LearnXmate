const mongoose = require("mongoose");

const AnnouncementSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        content: {
            type: String,
            required: true,
            trim: true
        },

        classroom: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Classroom",
            required: true
        },

        instructor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

const Announcement = mongoose.model(
    "Announcement",
    AnnouncementSchema
);

module.exports = Announcement;
const mongoose = require("mongoose");

const MeetingSchema = new mongoose.Schema(
    {
        title: {
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
        },

        meetingCode: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true
        },

        scheduledAt: {
            type: Date
        },

        status: {
            type: String,
            enum: ["scheduled", "live", "ended"],
            default: "scheduled"
        }
    },
    {
        timestamps: true
    }
);

const Meeting = mongoose.model("Meeting", MeetingSchema);

module.exports = Meeting;
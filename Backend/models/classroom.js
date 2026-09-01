const mongoose = require("mongoose");

const classroomSchema = new mongoose.Schema(
    {
        id: {
            type: Number,
            required: true,
            unique: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            trim: true
        },

        classCode: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true
        },

        teacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        students: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ]
    },
    {
        timestamps: true
    }
);

const Classroom = mongoose.model("Classroom", classroomSchema);

module.exports = Classroom;
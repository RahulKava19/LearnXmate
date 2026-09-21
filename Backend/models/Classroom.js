const mongoose = require("mongoose");

const ClassroomSchema = new mongoose.Schema(
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

const Classroom = mongoose.model("Classroom", ClassroomSchema);

module.exports = Classroom;
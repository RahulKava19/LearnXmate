const mongoose = require("mongoose");

const classroomInstructorSchema = new mongoose.Schema(
    {
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

classroomInstructorSchema.index(
    { classroom: 1, instructor: 1 },
    { unique: true }
);

const ClassroomInstructor = mongoose.model(
    "ClassroomInstructor",
    classroomInstructorSchema
);

module.exports = ClassroomInstructor;
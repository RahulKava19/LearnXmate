const mongoose = require("mongoose");

const ClassroomStudentSchema = new mongoose.Schema(
    {
        classroom: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Classroom",
            required: true
        },

        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

ClassroomStudentSchema.index(
    { classroom: 1, student: 1 },
    { unique: true }
);

const ClassroomStudent = mongoose.model(
    "ClassroomStudent",
    ClassroomStudentSchema
);

module.exports = ClassroomStudent;
const mongoose = require("mongoose");

const classroomInstructorSchema = new mongoose.Schema(
    {
        //type is kind of kind which is created by mongoose to create a reference to another model. In this case, we are creating a reference to the Classroom model and the User model.
        
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

//using composite indexing for faster performance and less request time for finding the instructor of a classroom. This will also ensure that a user cannot be added as an instructor to the same classroom multiple times.
classroomInstructorSchema.index(
    { classroom: 1, instructor: 1 },
    { unique: true }
);

const ClassroomInstructor = mongoose.model(
    "ClassroomInstructor",
    classroomInstructorSchema
);

module.exports = ClassroomInstructor;
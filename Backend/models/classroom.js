const mongoose = require("mongoose");

const classroomSchema = new mongoose.Schema({
    id:
    {
        type :  Number,
        required : true,
        unique : true
    },
    name: {
        type: String,
        required: true
    },

    description: {
        type: String
    },

    teacher: {
        type: String,
        required: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Classroom = mongoose.model("Classroom", classroomSchema);

module.exports = Classroom;
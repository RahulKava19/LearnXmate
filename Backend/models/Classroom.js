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
    },
    {
        timestamps: true
    }
);

const Classroom = mongoose.model("Classroom", ClassroomSchema);

module.exports = Classroom;

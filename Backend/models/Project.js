const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
    {
        id: {
            type: Number,
            required: true,
            unique: true
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
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

        dueDate: {
            type: Date
        },

        attachments: [
            {
                fileName: {
                    type: String
                },

                fileType: {
                    type: String
                },

                fileUrl: {
                    type: String
                }
            }
        ]
    },
    {
        timestamps: true
    }
);

const Project = mongoose.model("Project", projectSchema);

module.exports = Project;
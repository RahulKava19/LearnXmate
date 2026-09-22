const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
    {
        id: {
            type: Number,
            required: true,
            unique: true
        },

        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true
        },

        learner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
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

submissionSchema.index(
    { project: 1, learner: 1 },
    { unique: true }
);

const Submission = mongoose.model(
    "Submission",
    submissionSchema
);

module.exports = Submission;
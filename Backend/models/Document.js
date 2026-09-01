const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
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

    content: {
        type: String,
        trim: true
    },

    classroom: {
        type: Number,
        required: true
    },

    instructor: {
        type: Number,
        required: true
    },

    attachment: {
        fileName: {
            type: String
        },

        fileType: {
            type: String
        },

        fileUrl: {
            type: String
        }
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Document = mongoose.model("Document", documentSchema);

module.exports = Document;
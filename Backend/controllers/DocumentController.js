const Document = require("../models/Document");

const createDocument = async (req, res) => {
    try {
        const {
            id,
            title,
            content,
            classroom,
            instructor,
            attachment
        } = req.body;

        const document = await Document.create({
            id,
            title,
            content,
            classroom,
            instructor,
            attachment
        });

        res.status(201).json(document);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const getDocuments = async (req, res) => {
    try {
        const documents = await Document.find();

        res.status(200).json(documents);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const getDocumentById = async (req, res) => {
    try {
        const document = await Document.findOne({
            id: req.params.id
        });

        if (!document) {
            return res.status(404).json({
                message: "Document not found"
            });
        }

        res.status(200).json(document);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const getDocumentsByClassroom = async (req, res) => {
    try {
        const documents = await Document.find({
            classroom: req.params.classroomId
        });

        res.status(200).json(documents);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const updateDocument = async (req, res) => {
    try {
        const document = await Document.findOneAndUpdate(
            { id: req.params.id },
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!document) {
            return res.status(404).json({
                message: "Document not found"
            });
        }

        res.status(200).json(document);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const deleteDocument = async (req, res) => {
    try {
        const document = await Document.findOneAndDelete({
            id: req.params.id
        });

        if (!document) {
            return res.status(404).json({
                message: "Document not found"
            });
        }

        res.status(200).json({
            message: "Document deleted successfully",
            document
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

module.exports = {
    createDocument,
    getDocuments,
    getDocumentById,
    getDocumentsByClassroom,
    updateDocument,
    deleteDocument
};
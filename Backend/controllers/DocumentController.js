const Document = require("../models/Document");
const Classroom = require("../models/Classroom");
const ClassroomInstructor = require("../models/ClassroomInstructor");
const ClassroomStudent = require("../models/ClassroomStudent");

const uploadToCloudinary = require("../utils/cloudinaryUpload");
const cloudinary = require("../config/cloudinary");

// --------------------------------------------------
// DELETE CLOUDINARY FILES
// --------------------------------------------------

// This is useful when MongoDB document creation fails
// after files have already been uploaded to Cloudinary.
const deleteCloudinaryFiles = async (publicIds) => {
  for (const publicId of publicIds) {
    try {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: "raw",
      });
    } catch (error) {
      console.error(
        `Failed to delete Cloudinary file: ${publicId}`,
        error.message,
      );
    }
  }
};

// --------------------------------------------------
// CHECK CLASSROOM ACCESS
// --------------------------------------------------

const checkClassroomAccess = async (classroomId, user) => {
  const classroom = await Classroom.findOne({
    id: Number(classroomId),
  });

  if (!classroom) {
    return {
      allowed: false,
      classroom: null,
      message: "Classroom not found",
    };
  }

  // --------------------------------------------------
  // TEACHER
  // --------------------------------------------------

  // Teacher must be an instructor of the classroom.
  if (user.role === "teacher") {
    const instructor = await ClassroomInstructor.findOne({
      classroom: classroom._id,
      instructor: user.userId,
    });

    return {
      allowed: !!instructor,
      classroom,
      message: instructor
        ? null
        : "You are not an instructor of this classroom",
    };
  }

  // --------------------------------------------------
  // STUDENT
  // --------------------------------------------------

  // Student must be enrolled in the classroom.
  if (user.role === "student") {
    const student = await ClassroomStudent.findOne({
      classroom: classroom._id,
      student: user.userId,
    });

    return {
      allowed: !!student,
      classroom,
      message: student ? null : "You are not a member of this classroom",
    };
  }

  return {
    allowed: false,
    classroom,
    message: "You do not have access to this classroom",
  };
};

// --------------------------------------------------
// CREATE DOCUMENT
// --------------------------------------------------

const createDocument = async (req, res) => {
  const uploadedPublicIds = [];

  try {
    // Only teachers can create documents.
    if (req.user.role !== "teacher") {
      return res.status(403).json({
        message: "Only instructors can create documents",
      });
    }

    const { id, title, content, topic } = req.body;

    // --------------------------------------------------
    // FIND CLASSROOM
    // --------------------------------------------------

    const classroom = await Classroom.findOne({
      id: Number(req.params.classroomId),
    });

    if (!classroom) {
      return res.status(404).json({
        message: "Classroom not found",
      });
    }

    // --------------------------------------------------
    // CHECK TEACHER
    // --------------------------------------------------

    const instructor = await ClassroomInstructor.findOne({
      classroom: classroom._id,
      instructor: req.user.userId,
    });

    if (!instructor) {
      return res.status(403).json({
        message: "You are not the instructor of this classroom",
      });
    }

    // --------------------------------------------------
    // UPLOAD ATTACHMENTS
    // --------------------------------------------------

    const attachments = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploadedFile = await uploadToCloudinary(
          file.buffer,
          file.originalname,
          "documents",
        );

        // Keep track of uploaded Cloudinary files.
        // If MongoDB creation fails later,
        // we can delete these files.
        uploadedPublicIds.push(uploadedFile.publicId);

        attachments.push({
          fileName: file.originalname,
          fileType: file.mimetype,
          fileUrl: uploadedFile.fileUrl,
          publicId: uploadedFile.publicId,
        });
      }
    }

    // --------------------------------------------------
    // CREATE DOCUMENT
    // --------------------------------------------------

    const document = await Document.create({
      id,

      title,

      content,

      // Save topic.
      // If teacher doesn't provide one,
      // use "No topic".
      topic: topic?.trim() || "No topic",

      classroom: classroom._id,

      instructor: req.user.userId,

      attachments,
    });

    res.status(201).json(document);
  } catch (error) {
    // If something fails after Cloudinary upload,
    // delete uploaded files.
    await deleteCloudinaryFiles(uploadedPublicIds);

    res.status(500).json({
      message: error.message,
    });
  }
};

// --------------------------------------------------
// GET DOCUMENTS BY CLASSROOM
// --------------------------------------------------

const getDocumentsByClassroom = async (req, res) => {
  try {
    // Check whether teacher/student can access classroom.
    const access = await checkClassroomAccess(req.params.classroomId, req.user);

    // Classroom doesn't exist.
    if (!access.classroom) {
      return res.status(404).json({
        message: access.message,
      });
    }

    // User doesn't have access.
    if (!access.allowed) {
      return res.status(403).json({
        message: access.message,
      });
    }

    // Get all documents of this classroom.
    const documents = await Document.find({
      classroom: access.classroom._id,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json(documents);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// --------------------------------------------------
// GET DOCUMENT BY ID
// --------------------------------------------------

const getDocumentById = async (req, res) => {
  try {
    const access = await checkClassroomAccess(req.params.classroomId, req.user);

    if (!access.classroom) {
      return res.status(404).json({
        message: access.message,
      });
    }

    if (!access.allowed) {
      return res.status(403).json({
        message: access.message,
      });
    }

    const document = await Document.findOne({
      id: Number(req.params.documentId),
      classroom: access.classroom._id,
    });

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    res.status(200).json(document);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// --------------------------------------------------
// UPDATE DOCUMENT
// --------------------------------------------------

const updateDocument = async (req, res) => {
  try {
    // Only teacher can update documents.
    if (req.user.role !== "teacher") {
      return res.status(403).json({
        message: "Only instructors can update documents",
      });
    }

    // --------------------------------------------------
    // FIND CLASSROOM
    // --------------------------------------------------

    const classroom = await Classroom.findOne({
      id: Number(req.params.classroomId),
    });

    if (!classroom) {
      return res.status(404).json({
        message: "Classroom not found",
      });
    }

    // --------------------------------------------------
    // CHECK INSTRUCTOR
    // --------------------------------------------------

    const instructor = await ClassroomInstructor.findOne({
      classroom: classroom._id,
      instructor: req.user.userId,
    });

    if (!instructor) {
      return res.status(403).json({
        message: "You are not the instructor of this classroom",
      });
    }

    // --------------------------------------------------
    // UPDATE DOCUMENT
    // --------------------------------------------------

    const document = await Document.findOneAndUpdate(
      {
        id: Number(req.params.documentId),
        classroom: classroom._id,
      },

      {
        title: req.body.title,

        content: req.body.content,

        // Update topic too.
        topic: req.body.topic?.trim() || "No topic",
      },

      {
        new: true,
        runValidators: true,
      },
    );

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    res.status(200).json(document);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// --------------------------------------------------
// DELETE DOCUMENT
// --------------------------------------------------

const deleteDocument = async (req, res) => {
  try {
    // Only teacher can delete documents.
    if (req.user.role !== "teacher") {
      return res.status(403).json({
        message: "Only instructors can delete documents",
      });
    }

    // --------------------------------------------------
    // FIND CLASSROOM
    // --------------------------------------------------

    const classroom = await Classroom.findOne({
      id: Number(req.params.classroomId),
    });

    if (!classroom) {
      return res.status(404).json({
        message: "Classroom not found",
      });
    }

    // --------------------------------------------------
    // CHECK INSTRUCTOR
    // --------------------------------------------------

    const instructor = await ClassroomInstructor.findOne({
      classroom: classroom._id,
      instructor: req.user.userId,
    });

    if (!instructor) {
      return res.status(403).json({
        message: "You are not the instructor of this classroom",
      });
    }

    // --------------------------------------------------
    // FIND DOCUMENT
    // --------------------------------------------------

    const document = await Document.findOne({
      id: Number(req.params.documentId),
      classroom: classroom._id,
    });

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    // --------------------------------------------------
    // GET CLOUDINARY PUBLIC IDS
    // --------------------------------------------------

    const publicIds = document.attachments

      .map((attachment) => attachment.publicId)

      .filter(Boolean);

    // --------------------------------------------------
    // DELETE FROM MONGODB
    // --------------------------------------------------

    await Document.deleteOne({
      _id: document._id,
    });

    // --------------------------------------------------
    // DELETE FROM CLOUDINARY
    // --------------------------------------------------

    await deleteCloudinaryFiles(publicIds);

    res.status(200).json({
      message: "Document deleted successfully",

      document,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// --------------------------------------------------
// ADD ATTACHMENTS
// --------------------------------------------------

const addAttachments = async (req, res) => {
  const uploadedPublicIds = [];

  try {
    // Only teacher can add attachments.
    if (req.user.role !== "teacher") {
      return res.status(403).json({
        message: "Only instructors can add attachments",
      });
    }

    // --------------------------------------------------
    // FIND CLASSROOM
    // --------------------------------------------------

    const classroom = await Classroom.findOne({
      id: Number(req.params.classroomId),
    });

    if (!classroom) {
      return res.status(404).json({
        message: "Classroom not found",
      });
    }

    // --------------------------------------------------
    // CHECK INSTRUCTOR
    // --------------------------------------------------

    const instructor = await ClassroomInstructor.findOne({
      classroom: classroom._id,
      instructor: req.user.userId,
    });

    if (!instructor) {
      return res.status(403).json({
        message: "You are not the instructor of this classroom",
      });
    }

    // --------------------------------------------------
    // FIND DOCUMENT
    // --------------------------------------------------

    const document = await Document.findOne({
      id: Number(req.params.documentId),
      classroom: classroom._id,
    });

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    // --------------------------------------------------
    // CHECK FILES
    // --------------------------------------------------

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: "No attachments provided",
      });
    }

    // Maximum 10 attachments per document.
    if ((document.attachments?.length || 0) + req.files.length > 10) {
      return res.status(400).json({
        message: "A document can have maximum 10 attachments.",
      });
    }

    // --------------------------------------------------
    // UPLOAD FILES
    // --------------------------------------------------

    const newAttachments = [];

    for (const file of req.files) {
      const uploadedFile = await uploadToCloudinary(
        file.buffer,
        file.originalname,
        "documents",
      );

      uploadedPublicIds.push(uploadedFile.publicId);

      newAttachments.push({
        fileName: file.originalname,

        fileType: file.mimetype,

        fileUrl: uploadedFile.fileUrl,

        publicId: uploadedFile.publicId,
      });
    }

    // --------------------------------------------------
    // ADD TO DOCUMENT
    // --------------------------------------------------

    document.attachments.push(...newAttachments);

    await document.save();

    res.status(200).json(document);
  } catch (error) {
    // Remove uploaded Cloudinary files
    // if database operation fails.
    await deleteCloudinaryFiles(uploadedPublicIds);

    res.status(500).json({
      message: error.message,
    });
  }
};

// --------------------------------------------------
// DELETE ATTACHMENT
// --------------------------------------------------

const deleteAttachment = async (req, res) => {
  try {
    // Only teacher can delete attachments.
    if (req.user.role !== "teacher") {
      return res.status(403).json({
        message: "Only instructors can delete attachments",
      });
    }

    // --------------------------------------------------
    // FIND CLASSROOM
    // --------------------------------------------------

    const classroom = await Classroom.findOne({
      id: Number(req.params.classroomId),
    });

    if (!classroom) {
      return res.status(404).json({
        message: "Classroom not found",
      });
    }

    // --------------------------------------------------
    // CHECK INSTRUCTOR
    // --------------------------------------------------

    const instructor = await ClassroomInstructor.findOne({
      classroom: classroom._id,
      instructor: req.user.userId,
    });

    if (!instructor) {
      return res.status(403).json({
        message: "You are not the instructor of this classroom",
      });
    }

    // --------------------------------------------------
    // FIND DOCUMENT
    // --------------------------------------------------

    const document = await Document.findOne({
      id: Number(req.params.documentId),

      classroom: classroom._id,
    });

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    // --------------------------------------------------
    // FIND ATTACHMENT
    // --------------------------------------------------

    const attachment = document.attachments.id(req.params.attachmentId);

    if (!attachment) {
      return res.status(404).json({
        message: "Attachment not found",
      });
    }

    // Save Cloudinary ID before deleting.
    const publicId = attachment.publicId;

    // Remove attachment from MongoDB.
    attachment.deleteOne();

    await document.save();

    // Remove file from Cloudinary.
    if (publicId) {
      await deleteCloudinaryFiles([publicId]);
    }

    res.status(200).json({
      message: "Attachment deleted successfully",

      document,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// --------------------------------------------------
// EXPORT CONTROLLERS
// --------------------------------------------------

module.exports = {
  createDocument,
  getDocumentsByClassroom,
  getDocumentById,
  updateDocument,
  addAttachments,
  deleteAttachment,
  deleteDocument,
};

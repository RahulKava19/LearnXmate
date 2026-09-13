const multer = require("multer");
const path = require("path");
const fs = require("fs");

const createUploadMiddleware = (folder) => {
    const uploadPath = path.join(
        __dirname, 
        "../uploads",
        folder
    );

    // Create upload folder if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, {
            recursive: true,
        });
    }

    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, uploadPath);
        },

        filename: (req, file, cb) => {
            const uniqueName =
                Date.now() +
                "-" +
                Math.round(Math.random() * 1e9) +
                path.extname(file.originalname);

            cb(null, uniqueName);
        },
    });

    const uploadDocument = multer({
        storage: storage,
        limits: {
            fileSize: 10 * 1024 * 1024,
            files: 10,
        },
    });

    return uploadDocument;
};

module.exports = createUploadMiddleware;

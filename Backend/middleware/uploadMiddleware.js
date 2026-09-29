const multer = require("multer");

const createUploadMiddleware = () => {
    const storage = multer.memoryStorage();

    return multer({
        storage,
        limits: {
            fileSize: 10 * 1024 * 1024,
            files: 10
        }
    });
};

module.exports = createUploadMiddleware;
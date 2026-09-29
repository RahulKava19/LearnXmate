const cloudinary = require("../config/cloudinary");

const uploadToCloudinary = (
    buffer, // Stores the binary data of the file
    originalName,
    folder
) => {
    return new Promise((resolve, reject) => {
        //This is the Cloudinary method that allows us to send the file's data to Cloudinary.
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: "raw", // So it can support PDF, DOCX etc. WIthout it, will only support image
                use_filename: false // Don't use filename as PublicId
            },
            (error, result) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve({
                    publicId: result.public_id,
                    fileUrl: result.secure_url //https url
                });
            }
        );

        uploadStream.end(buffer);
    });
};

module.exports = uploadToCloudinary;
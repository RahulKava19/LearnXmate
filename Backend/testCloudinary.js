require("dotenv").config();

const cloudinary = require("./config/cloudinary");

const testCloudinary = async () => {
    try {
        const result = await cloudinary.api.ping();

        console.log("Cloudinary connection successful!");
        console.log(result);
    } catch (error) {
        console.error("Cloudinary connection failed!");
        console.error(error.message);
    }
};

testCloudinary();
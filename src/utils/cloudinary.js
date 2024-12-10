import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';



    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_CLOUD_SECRET,
        api_secret: CLOUDINARY_API_KEY
    })
    

const uploadOnCloudinary = async (localFilePath) =>{
    try {
        if(!localFilePath) return null

        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto"
        })
        console.log("file is successfully uploaded on Cloudinary",response.url);

        return response
        
    } catch (error) {

        fs.unlinkSync(localFilePath)
        
    }
    

}

export {uploadOnCloudinary}
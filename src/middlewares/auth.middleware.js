import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";



export const verifyJWT = asyncHandler(async(req,res,next)=>{
    try {

        const token = req.cookies?.accessToken || req.header("Authorization")?.split(" ")[1];
       if(!token){
        res.status(401).json("Unauthorized request - Token is missing")
       }
     const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
     const user = await User.findById(decodedToken?._id).select("-password")
    
        if(!user){
            res.status(401).json("Invalid Access Token - User not found")  
       }
     req.user = user
     next()
       
    
    } catch (error) {
            throw new ApiError(401, error.message || "Invalid Access Token" ) 
    }
})
import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {ApiResponse} from "../utils/ApiResponse.js"

const generateAccessTokens = async(userId)=>{
    try{
        await User.findById(userId)
         const accessToken = await User.generateAccessTokens()

         return(accessToken)


    }
    catch(error){
        return res.json("Something went wrong while generating Access Token")


        }
}


const registerUser = asyncHandler(async (req, res) => {
    // Get user data from frontend
    const { username, email, password, fullName } = req.body;

    // Validate the data from user   
    if ([username, email, password].some((field) => field?.trim() === "")) {
        return res.status(400).json({ message: "Username, Email, Password fields are required" });
    }

    // Check if the user already exists
    const existedUser = await User.findOne({ email });
    if (existedUser) {
        return res.status(400).json({ message: "User Already Exists with this Email" });
    }

    try {
        // Create user object and create a DB entry
        const user = await User.create({
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            fullName: fullName ? fullName : "",
            password,
        });

        // Respond with success if user is created successfully
        res.status(201).json({
            message: "User registered successfully",
            user: {
                username: user.username,
                email: user.email,
                fullName: user.fullName,
            },
        });
    } catch (error) {
        if (error.code === 11000) { // MongoDB duplicate key error code
            return res.status(400).json({ message: `User with username "${username}" already exists` });
        }
        // Handle any other errors
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});


const loginUser = asyncHandler(async (req, res)=>{

const {username, email, password} = req.body
if(!username && !email){
    return res.json("Something went wrong while generating Access Token")
}

const user = await User.findOne({
    $or: [{username},{email}]
})

if(!user){
    return res.json("User doesn't Exist")
}

const isPasswordValid =   await user.isPasswordCorrect(password)

if(!isPasswordValid){
return res.json("Invalid User Credentials")
}


const accessToken = await user.generateAccessToken(user._id)


const loggedInUser = await User.findById(user._id).select("-password")

const options = {
    httpOnly: true,
    secure: true
}

return res.status(200)
.cookie("accessToken", accessToken, options)
.json(
    new ApiResponse(200,{user: loggedInUser , accessToken },"User Logged In Successfully" )
)

})

const logoutUser = asyncHandler(async(req,res)=>{

    const options = {
        httpOnly: true, 
        secure: true,   
        sameSite: 'Strict', 
        path: '/' 
    };
    
res.status(200)
.clearCookie("accessToken", options)
.json(
    new ApiResponse(200,"A user loggedout successfully")
)
})

const changeCurrentPassword = asyncHandler(async(req,res)=>{

    const {oldPassword, newPassword} = req.body

    console.log(oldPassword,newPassword)

     const user = await User.findById(req.user._id)

     const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    
     if(!isPasswordCorrect){
        return res.json("Incorrect Password")
     }


     user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password Changed Successfully"))
})

const updateAccountDetails = asyncHandler(async(req,res)=>{

    const {email, fullName, username} = req.body
    
    if(email){
        const existedUserEmail = await User.findOne({email})
        if(existedUserEmail){
            return res.json("User Already Exists with this Email")
        }
    }
    if(username){
    const existedUsername = await User.findOne({username})
        if(existedUsername){
          return res.json("User Already Exists with this username")
        }
    }
    let updateFields = {};
  
    
   

    if (fullName) updateFields.fullName = fullName;
    if (email) updateFields.email = email;
    if (username) updateFields.username = username;

   await User.findByIdAndUpdate(req.user._id,
    { $set: updateFields },
    { new: true }
   ).select("-password")

   return res
   .status(200)
   .json( new ApiResponse(200,{},"Account Details Updated Successfully"))


})




const loggedinuUserAccessible = asyncHandler(async(req,res)=>{

    res.status(200).json(
        new ApiResponse(200,req.user,"Secured Route")
    )


})

export {
    registerUser,
    loginUser,
    logoutUser,
    loggedinuUserAccessible,
    changeCurrentPassword,
    updateAccountDetails
}
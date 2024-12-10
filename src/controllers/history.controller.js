import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { InterviewSession } from "../models/interviewSession.model.js";
import { User } from "../models/user.model.js";;
import {ObjectId} from "bson";

const userHistory = asyncHandler ( async (req,res)=>{

    
    const user = await User.findById(req.user._id)

    const interviews = await InterviewSession.find({user : user._id}).select("-interviewConversation -cvText -jobDescription -interview_status -threadid  -user -createdAt -updatedAt -__v")
     console.log(interviews)

    if (interviews.length === 0) {
        return res.status(404).json({ message: 'No interviews found for this user' });
      }
  
      res.status(200).json(new ApiResponse(200,interviews))



})

const detailedUserHistory = asyncHandler(async (req,res)=>{
    const {interviewID} = req.body;
    const interviewResult = await InterviewSession.findById(interviewID).select("-interview_status -threadid -_id -user -__v")
    res.status(200).json(new ApiResponse(200,interviewResult))
})

export {
    userHistory,
    detailedUserHistory
}
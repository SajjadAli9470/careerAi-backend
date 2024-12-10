import mongoose from 'mongoose'


const interviewSessionSchema = new mongoose.Schema({

interviewConversation:{ 
    type:Array,
    required:true,
    default: []
},
cvText:{ 
    type:String,
    required: true
},
jobDescription:{ 
    type:String,
    required: true
},

interview_status:{
    type: String,
    enum: ['started','finished'],
    required: true
},
interview_complexity:{
    type: String,
    enum: ['easy','medium','hard'],
    required: true
},
rating:{ 
    type:Number 
},
suggestion:{ 
    type:String 
},
feedback:{ 
    type:String,
},
title:{
    type: String
},
threadid:{
    type: String,
    required: true
},
user:{
    type: mongoose.Schema.Types.ObjectId,
    ref:'User'
}

  

},{timestamps: true})



export const InterviewSession = mongoose.model("InterviewSession",interviewSessionSchema)
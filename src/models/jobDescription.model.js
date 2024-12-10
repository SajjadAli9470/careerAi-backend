import mongoose, { mongo } from "mongoose"



const jobDescriptionSchema = new mongoose.Schema({
    descriptionText:{
        type: String,
        required: true
    },
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
},{timestamps: true})


export const JobDescription = mongoose.model("JobDescription",jobDescriptionSchema)
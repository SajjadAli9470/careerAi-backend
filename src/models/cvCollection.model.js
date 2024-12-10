
  import mongoose from "mongoose"

const cvCollectionSchema = new mongoose.Schema({
  cvFileUrl:{
    type:String,
  },
  cvText:{
    type:String,
  },
  user:{
    type: mongoose.Schema.Types.ObjectId,
    ref:'User'
}


},{timestamps:true})


export const CvCollection = mongoose.model("CvCollection",cvCollectionSchema)
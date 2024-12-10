
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { CvCollection } from "../models/cvCollection.model.js";
import { InterviewSession } from "../models/interviewSession.model.js";
import { User } from "../models/user.model.js";
import OpenAI from "openai";
import { ApiError } from "../utils/ApiError.js";



const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,});


    async function getLastTwoMessages(threadId) {
      try {
          // Fetch all messages from the thread
          const response = await openai.beta.threads.messages.list(threadId);
          const messages = response.data.reverse();
  
          // Check if there are at least two messages
          if (messages.length >= 2) {
              // Get the last two messages
              const lastTwoMessages = messages.slice(-2);
              return lastTwoMessages;
          } else {
              // If less than two messages, return what is available
              return messages;
          }
      } catch (error) {
          console.error("Error fetching thread messages:", error);
          return null;
      }
  }
  
 function removeInterviewCode(text) {
  // Regular expression to match the pattern "Interview code is: <code>." and remove it.
  const pattern = /and the interview code is:\s*\w+\s*\./i;
  return text.replace(pattern, '');
}




const startInterviewSession = asyncHandler(async (req,res)=>{


    
    const {cvID, jobDescription, complexity, } = req.body;
    let {cvTextInput} = req.body
    

    if (!jobDescription || !complexity) {
        return res.status(400).json({ message: "jobDescription or Complexity are missing" });
    }

    if(!cvID && !cvTextInput){
        return res.status(400).json({ message: "There should either be cvText or cvID to start the interview" });
    }

    if(cvID){
    const cvDocument = await CvCollection.findById(cvID)
    cvTextInput = cvDocument.cvText
    }
    // // ^^^^^^^^^^^^^^^^^^^^^^^ CV AND JOB RELEVANCY CHECK ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

    try{
    const checkCvAndJobRelevancy = [
      {
        role: "user",
        content: `Please review the following CV and job description. 
                  1 If the CV matches the job description, return: { "match": true, "suggestion": "" } dont add any comment just just the return response as asked when its true.
                  2 If the CV does not match the job description, return: { "match": false, "suggestion":  suggestion the user for other positions the user should consider based on the CV} 
                  3 if the job description and cv has the same domain (field) but with different experience level should be considered matched and return true.
                  CV: ${cvTextInput}
                  
                  Job Description: ${jobDescription}`,
      },
    ];

  
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: checkCvAndJobRelevancy,
      max_tokens: 250
    });
    console.log(response.choices[0].message.content)
    const modelResponse= response.choices[0].message.content;
    const matchResult = JSON.parse(modelResponse);

    if (!matchResult.match) {
        return res.status(200).json(new ApiResponse (200,{matchResult},"The user CV doesn't Match with the Job Description"));
    }
  }catch(error){
    throw new ApiError(500, "We were unable to parse the response")

  }



       
//fetch the  Assistant
    const assistantID = process.env.ASSISTANT_ID

    // fetch username from the user field in the databas
   const user = await User.findById(req.user._id)

//create a Thread
    const thread = await openai.beta.threads.create()


// Message ( dummy )
    const message = await openai.beta.threads.messages.create(
        thread.id,
        {
         role: `user`,
         content: `address the user as ${user.username}`
        }
     );


        let run = await openai.beta.threads.runs.createAndPoll(
        thread.id,
        { 
          assistant_id: assistantID,
          instructions: `You are conducting a job interview.
          Please provide appropriate questions based on the CV complexity and  job description.
          conducting interview instructions:
          1. one question at a time
          2. ask around 10-12 questions
          3. there should be behavioral, psychological, conceptual, technical (if technical job).
          4. once interview has finished, write a finishing code in the last message interview code is: brohi1231 and the last message should be like this thank you for interview and interview code.
          5. Start the interview my greeting the user like this, "Its good to have you here Mr. ${user.username} of the user. Here is our first question.
          CV: ${cvTextInput}
          Job Description: ${jobDescription}
          Complexity: ${complexity}`
          
        } );

        const conversationArray = [];
        if (run.status === 'completed') {
            const messages = await openai.beta.threads.messages.list(
              run.thread_id
            );
            for (const message of messages.data.reverse()) {
               let conversation = `${message.content[0].text.value}`
               conversationArray.push(conversation)
            }
          } else {
            console.log(run.status);
          }

          // agent's response with greeting as soon as the cv and jd matches.
          const assistantMessage = {
              assistant: conversationArray[1]
            }

          // agent's response with greeting as soon as the cv and jd matches.
          console.log(assistantMessage)

          const interviewStatus = 'started'

          const  interviewSession = await InterviewSession.create({

             interviewConversation: assistantMessage,
             cvText: cvTextInput,
             jobDescription: jobDescription,
             interview_complexity: complexity,
             interview_status: interviewStatus,
             threadid: thread.id,
             user: user._id
           })

           console.log(interviewSession)


           return res.status(200).json(new ApiResponse(200, assistantMessage, interviewSession, "Interview has started"))
})










const interviewSession = asyncHandler(async (req,res)=>{
 const {interviewID, userInput} = req.body;
  // take interview id userInput as input and userInput

  // get the user from database
  const user = await User.findById(req.user._id)


 // store the interview in a variable by using interview id
  const interview = await InterviewSession.findById(interviewID)


  // extract the threadid from the interview
  const threadID = interview.threadid


 // make the run call and give exact same instructions too

  await openai.beta.threads.messages.create(
    threadID,
    {
    role: `user`,
    content: `${userInput}`
    }
  );



 let run = await openai.beta.threads.runs.createAndPoll(
  threadID,
  { 
    assistant_id: process.env.ASSISTANT_ID,
    instructions: `You are conducting a job interview.
    Please provide appropriate questions based on the CV complexity and  job description.
    conducting interview instructions:
    1. one question at a time
    2. ask around 10-12 questions
    3. there should be behavioral, psychological, conceptual, technical (if technical job).
    4. once interview has finished, write a finishing code in the last message interview code is: brohi1231 and the last message should be like this thank you for interview and interview code.
    5. Start the interview my greeting the user like this, "Its good to have you here Mr. ${user.username} of the user. Here is our first question.
    CV: ${interview.cvText}
    Job Description: ${interview.jobDescription}
    Complexity: ${interview.interview_complexity}`
    
  } );



  const intconversation = []

  const latestMessages = await getLastTwoMessages(threadID)
  
  for (const message of latestMessages) {
    let conversation = `${message.content[0].text.value}`
    intconversation.push(conversation)
  }
   const userMessage = {
    user: intconversation[0]
   }
   let assistantMessage = {
    assistant: intconversation[1]
   }
  
  console.log(userMessage,assistantMessage)
   
  

 // store the messages in an Object
  
 // check the messages if they contain the code crai#1231 if found change the status of the interview in the database to finished
 
 if(assistantMessage.assistant.includes("brohi1231")){
  
   assistantMessage.assistant = removeInterviewCode(assistantMessage.assistant);
      await InterviewSession.findByIdAndUpdate(interviewID,
        {
          $push:{
            interviewConversation: { 
              $each: [assistantMessage] 
            }
          },
          $set:{
            interview_status: "finished"
          }
        }
        ,{new: true}
      )
  }
  const checkfinish = await InterviewSession.findById(interviewID)
  //console.log(userMessage, assistantMessage)
  
  // store the object in the database

  //console.log("check finsih: ",checkfinish)
  if(checkfinish.interview_status !== "finished"){
  
  await InterviewSession.findByIdAndUpdate(interviewID,
    {
      $push:{
        interviewConversation: { 
          $each: [userMessage, assistantMessage] 
        }
      }
    }
    ,{new: true}
  )
  return res.status(200).json(new ApiResponse(200, assistantMessage, "communication is succesfully done") )
}


 const interviewrecordupdate = await InterviewSession.findById(interviewID)
    // give all the conversation, cv, complexity and job description to the model directly for suggestions, feedback, and rating.
    if (interviewrecordupdate.interview_status === "finished"){
  const reviewandgenerateResults = [
    {
      role: "user",
      content: `- Instructions:
                - deeply analyse  the CV, Job Description, Complexity, and the Entire Interview transcript.
                - the transcript is the coversation between assistant and user where user is the candidate and assistant is the interviewer.
                - then provide a proper  feedback, Suggestion, and Score out of 100 for the user make strict scoring.
                - try to focus on the answers of the candidate based on the questions asked by the assistant.
                - do not critisize the transcript quality focus more on the conversation in the interview.
                - whenever you are talking about the candidate use You ( example: your answers were not clear in the question ...)
                - make sure it is in json parsable format, like this; [{Suggestion : the suggestion you provide, },{Feedback: the feedbadck you provide}, {Rating: the rating you provide (1-100), {Title: provide a title, title should be based of the job name or company name}}
                - Rating should be very dependent on the performance if the candidate perform well and shows interest score consider it good, if the candidate seems disinterested and avoiding to answer rate it bad.
                CV: ${interviewrecordupdate.cvText}
                complexity: ${interviewrecordupdate.complexity}
                Job Description: ${interviewrecordupdate.jobDescription}
                transcript: ${interviewrecordupdate.interviewConversation}`
                
    },
  ];

  const iresponse = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: reviewandgenerateResults,
    max_tokens: 1050,
    response_format: { type: "json_object" }
  });

  //console.log(iresponse.choices[0].message.content)
  const modelResponse = iresponse.choices[0].message.content;
  console.log(modelResponse)
  const generatedFSR = JSON.parse(modelResponse);

console.log(`${generatedFSR} this is fsr`)
  
  // store the suggestions, feedback, and rating in the database and return the response.

  const storeFSR =  await InterviewSession.findByIdAndUpdate(interviewID,
    {
      $set:{
        feedback: generatedFSR?.Feedback,
        rating: generatedFSR?.Rating,
        suggestion: generatedFSR?.Suggestion,
        title: generatedFSR?.Title
      }
    }
    ,{new: true}
  )

  console.log(`${storeFSR} this is stored fsr`)

  const updatedValues = await InterviewSession.findById(interviewID)
  
  console.log(updatedValues)
  return res.status(200).json(new ApiResponse(200,assistantMessage, generatedFSR, "The interview has finished successfully. feedback suggestions and rating is done."))

 
}


//console.log(userMessage);
//console.log(assistantMessage);


 


  
  
})






export {
    startInterviewSession,
    interviewSession
}
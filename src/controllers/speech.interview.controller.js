import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { CvCollection } from "../models/cvCollection.model.js";
import { InterviewSession } from "../models/interviewSession.model.js";
import { User } from "../models/user.model.js";
import OpenAI from "openai";
import { ApiError } from "../utils/ApiError.js";
import WebSocket, { WebSocketServer } from "ws";

// OpenAI Setup
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Helper Functions
async function getLastTwoMessages(threadId) {
    try {
        const response = await openai.beta.threads.messages.list(threadId);
        const messages = response.data.reverse();
        return messages.slice(-2);
    } catch (error) {
        console.error("Error fetching thread messages:", error);
        return [];
    }
}

function removeInterviewCode(text) {
    const pattern = /and the interview code is:\s*\w+\s*\./i;
    return text.replace(pattern, "");
}

// WebSocket Setup
let wsServer;
function setupWebSocket(server) {
  wsServer = new WebSocketServer({ server });

  wsServer.on("connection", (socket) => {
      socket.userId = socket.protocol; // Assuming userId is passed as a subprotocol during WebSocket connection
      socket.on("message", async (message) => {
          try {
              const { interviewID, userInput } = JSON.parse(message);
              const user = await User.findById(socket.userId); // Pass userId to WebSocket on connection
              const interview = await InterviewSession.findById(interviewID);

              if (!interview) {
                  socket.send(JSON.stringify({ error: "Invalid interview ID" }));
                  return;
              }

              const threadID = interview.threadid;

              // Send user input to the thread
              await openai.beta.threads.messages.create(threadID, {
                  role: "user",
                  content: userInput,
              });

              // Fetch assistant's response
              const run = await openai.beta.threads.runs.createAndPoll(threadID, {
                  assistant_id: process.env.ASSISTANT_ID,
                  instructions: `Conduct an interview based on the job description and CV.
                      Follow these guidelines:
                      1. One question at a time.
                      2. Behavioral, conceptual, and technical questions.
                      3. Finish the interview with a specific closing statement including the interview code.`,
              });

              const latestMessages = await getLastTwoMessages(threadID);
              const userMessage = { user: latestMessages[0]?.content || "" };
              let assistantMessage = { assistant: latestMessages[1]?.content || "" };

              if (assistantMessage.assistant.includes("brohi1231")) {
                  assistantMessage.assistant = removeInterviewCode(assistantMessage.assistant);
                  await InterviewSession.findByIdAndUpdate(interviewID, {
                      $push: {
                          interviewConversation: { $each: [assistantMessage] },
                      },
                      $set: { interview_status: "finished" },
                  });
              } else {
                  await InterviewSession.findByIdAndUpdate(interviewID, {
                      $push: {
                          interviewConversation: { $each: [userMessage, assistantMessage] },
                      },
                  });
              }

              socket.send(JSON.stringify({ userMessage, assistantMessage }));
          } catch (error) {
              console.error("Error during interview:", error);
              socket.send(JSON.stringify({ error: "An error occurred during the interview." }));
          }
      });

      // Voice-Based Functionality Integration
      socket.on("voiceMessage", async (voiceData) => {
          try {
              // Establish connection to OpenAI Realtime API for voice processing
              const openAiWs = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01', {
                  headers: {
                      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                      "OpenAI-Beta": "realtime=v1"
                  }
              });

              openAiWs.on('open', () => {
                  const sessionUpdate = {
                      type: 'session.update',
                      session: {
                          turn_detection: { type: 'server_vad' },
                          input_audio_format: 'g711_ulaw',
                          output_audio_format: 'g711_ulaw',
                          voice: 'alloy',
                          instructions: 'You are a helpful and bubbly AI assistant...',
                          modalities: ["text", "audio"],
                          temperature: 0.8,
                      }
                  };
                  openAiWs.send(JSON.stringify(sessionUpdate));
              });

              openAiWs.on('message', (data) => {
                  const response = JSON.parse(data);
                  if (response.type === 'response.audio.delta' && response.delta) {
                      socket.send(JSON.stringify({
                          event: 'media',
                          media: { payload: Buffer.from(response.delta, 'base64').toString('base64') }
                      }));
                  }
              });

              // Append incoming voice data to OpenAI input buffer
              const audioAppend = {
                  type: 'input_audio_buffer.append',
                  audio: voiceData
              };
              openAiWs.send(JSON.stringify(audioAppend));

          } catch (error) {
              console.error("Error handling voice message:", error);
              socket.send(JSON.stringify({ error: "An error occurred processing voice data." }));
          }
      });

      // Handle connection close
      socket.on("close", () => {
          console.log(`User ${socket.userId} disconnected.`);
      });
  });
}


// Start Interview Session
const startSpeechInterviewSession = asyncHandler(async (req, res) => {
    const { cvID, jobDescription, complexity } = req.body;
    let { cvTextInput } = req.body;

    if (!jobDescription || !complexity || (!cvID && !cvTextInput)) {
        throw new ApiError(400, "Missing required fields");
    }

    if (cvID) {
        const cvDocument = await CvCollection.findById(cvID);
        cvTextInput = cvDocument?.cvText;
    }

    // Check CV and Job Description Match
    const checkCvAndJobRelevancy = [
        {
            role: "user",
            content: `Check if the CV matches the job description. Return JSON { "match": true, "suggestion": "" } or { "match": false, "suggestion": "reason" }.
            CV: ${cvTextInput}
            Job Description: ${jobDescription}`,
        },
    ];

    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: checkCvAndJobRelevancy,
        max_tokens: 250,
    });

    const modelResponse = JSON.parse(response.choices[0]?.message?.content || "{}");

    if (!modelResponse.match) {
        return res.status(200).json(new ApiResponse(200, modelResponse, "CV does not match job description"));
    }

    const user = await User.findById(req.user._id);
    const thread = await openai.beta.threads.create();

    await openai.beta.threads.messages.create(thread.id, {
        role: `user`,
        content: `Address the user as ${user.username}`,
    });

    const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
        assistant_id: process.env.ASSISTANT_ID,
        instructions: `Conduct an interview based on the CV and job description.
        - Greet the user: "It's good to have you here Mr. ${user.username}. Here is our first question."
        - Follow interview guidelines.`,
    });

    const assistantMessage = run.status === "completed" ? run.result.messages[0]?.content : "Interview started.";
    const interviewStatus = "started";

    const interviewSession = await InterviewSession.create({
        interviewConversation: [{ assistant: assistantMessage }],
        cvText: cvTextInput,
        jobDescription,
        interview_complexity: complexity,
        interview_status: interviewStatus,
        threadid: thread.id,
        user: user._id,
    });

    res.status(200).json(new ApiResponse(200, assistantMessage, interviewSession, "Interview has started"));
});

// Handle Interview Session
const speechInterviewSession = asyncHandler(async (req, res) => {
    const { interviewID, userInput } = req.body;
    const user = await User.findById(req.user._id);
    const interview = await InterviewSession.findById(interviewID);

    if (!interview) {
        throw new ApiError(404, "Interview session not found");
    }

    const threadID = interview.threadid;

    // Send user input to the thread
    await openai.beta.threads.messages.create(threadID, {
        role: "user",
        content: userInput,
    });

    const run = await openai.beta.threads.runs.createAndPoll(threadID, {
        assistant_id: process.env.ASSISTANT_ID,
        instructions: `Conduct an interview based on the job description and CV.`,
    });

    const latestMessages = await getLastTwoMessages(threadID);
    const userMessage = { user: latestMessages[0]?.content || "" };
    let assistantMessage = { assistant: latestMessages[1]?.content || "" };

    if (assistantMessage.assistant.includes("brohi1231")) {
        assistantMessage.assistant = removeInterviewCode(assistantMessage.assistant);
        await InterviewSession.findByIdAndUpdate(interviewID, {
            $push: {
                interviewConversation: { $each: [assistantMessage] },
            },
            $set: { interview_status: "finished" },
        });
    } else {
        await InterviewSession.findByIdAndUpdate(interviewID, {
            $push: {
                interviewConversation: { $each: [userMessage, assistantMessage] },
            },
        });
    }

    res.status(200).json(new ApiResponse(200, assistantMessage, "Communication successful"));
});

export { startSpeechInterviewSession , speechInterviewSession, setupWebSocket };

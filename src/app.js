import express, { urlencoded } from 'express'
import cors from  'cors'
import cookieParser from 'cookie-parser'


const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended:true, limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())


import userRouter from './routes/user.route.js';
import cvRouter from './routes/cv.route.js'
import interviewRouter from './routes/interview.route.js'
import historyRouter from './routes/history.route.js'
import { AccessToken } from 'livekit-server-sdk';
import OpenAI from 'openai'

const createToken = async () => {
  // If this room doesn't exist, it'll be automatically created when the first
  // participant joins
  const roomName = 'quickstart-room';
  // Identifier to be used for participant.
  // It's available as LocalParticipant.identity with livekit-client SDK
  const participantName = 'quickstart-username';

  const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
    identity: participantName,
    metadata: {
      
    },
    // Token to expire after 10 minutes
    ttl: '10m',
  });
  at.addGrant({ roomJoin: true, room: roomName });

  return await at.toJwt();
};



app.get('/api/v1/getToken', async (req, res) => {
    res.send(await createToken());
});
app.use("/api/v1/users",userRouter)
app.use("/api/v1/cv", cvRouter)
app.use("/api/v1/interview", interviewRouter)
app.use("/api/v1/history", historyRouter)
app.use("/api/v1/speech-interview", interviewRouter)



export {app}
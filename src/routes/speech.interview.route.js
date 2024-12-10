import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { interviewSession, speechInterviewSession, startInterviewSession } from "../controllers/speech.interview.controller.js";

const router = Router()

router.route("/start-speech-interview-session").post(verifyJWT, startInterviewSession)
router.route("/speech-interview-session").get(verifyJWT, speechInterviewSession)

export default router
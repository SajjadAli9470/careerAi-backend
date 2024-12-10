import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { startInterviewSession, interviewSession } from "../controllers/interview.controller.js";

const router = Router()

router.route("/start-interview-session").post(verifyJWT, startInterviewSession)
router.route("/interview-session").post(verifyJWT, interviewSession)


export default router
import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { userHistory, detailedUserHistory } from "../controllers/history.controller.js";
const router = Router()

router.route("/user-history").get(verifyJWT, userHistory)
router.route("/detailed-user-history").get(verifyJWT, detailedUserHistory)


export default router
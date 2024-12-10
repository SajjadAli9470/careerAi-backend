import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {upload} from "../middlewares/multer.middleware.js"
import {listcvfiles, uploadCvFile} from "../controllers/cv.controller.js"

const router = Router()

router.route("/listcvfiles").get(verifyJWT, listcvfiles )
router.route("/uploadcv").post(verifyJWT, upload.single("CV"), uploadCvFile)

export default router

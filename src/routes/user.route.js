import { Router } from "express";
import { registerUser,loginUser,logoutUser,changeCurrentPassword,updateAccountDetails,loggedinuUserAccessible } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {upload} from "../middlewares/multer.middleware.js";

const router = Router()
router.route("/register").post(upload.none(),registerUser)
router.route("/login").post(loginUser)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
//secured routes
router.route("/update-account").put(verifyJWT, updateAccountDetails)

router.route("/update").post(verifyJWT, loggedinuUserAccessible)
router.route("/logout").post(verifyJWT, logoutUser)


    
export default router
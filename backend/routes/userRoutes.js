import express from "express";
import {
	followUnFollowUser,
	getUserProfile,
	loginUser,
	logoutUser,
	signupUser,
	updateUser,
	getSuggestedUsers,
	getFollowingUsers,
	freezeAccount,
	verifyEmail,
	resendVerification,
    searchUsers,
    setPrivacy,
} from "../controllers/userController.js";
import protectRoute from "../middlewares/protectRoute.js";
import multer from "multer";

const upload = multer({ dest: "uploads/" });

const router = express.Router();

router.get("/profile/:query", getUserProfile);
router.get("/search", searchUsers);
router.get("/suggested", protectRoute, getSuggestedUsers);
router.get("/following", protectRoute, getFollowingUsers);
router.post("/signup", signupUser);
router.post("/login", loginUser);
router.get("/verify/:token", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/logout", logoutUser);
router.post("/follow/:id", protectRoute, followUnFollowUser); // Toggle state(follow/unfollow)
router.put("/update/:id", protectRoute, upload.single("profilePic"), updateUser);
router.put("/freeze", protectRoute, freezeAccount);
router.put("/privacy", protectRoute, setPrivacy);

export default router;

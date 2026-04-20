import express from "express";
import {
	createPost,
	deletePost,
	getPost,
	likeUnlikePost,
	replyToPost,
	getFeedPosts,
	getUserPosts,
	getUserReplies,
	deleteReply,
} from "../controllers/postController.js";
import protectRoute from "../middlewares/protectRoute.js";
import multer from "multer";

const upload = multer({ dest: "uploads/" });

const router = express.Router();

router.get("/feed", protectRoute, getFeedPosts);
router.get("/:id", getPost);
router.get("/user/:username", getUserPosts);
router.get("/user/:username/replies", getUserReplies);
router.post("/create", protectRoute, upload.single("img"), createPost);
router.delete("/:id", protectRoute, deletePost);
router.delete("/:id/reply/:replyId", protectRoute, deleteReply);
router.put("/like/:id", protectRoute, likeUnlikePost);
router.put("/reply/:id", protectRoute, replyToPost);

export default router;

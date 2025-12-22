import Post from "../models/postModel.js";
import User from "../models/userModel.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

const createPost = async (req, res) => {
	try {
		const { postedBy, text, mediaType } = req.body;
		let img = req.body.img; // fallback if client sends a URL

		if (!postedBy || !text) {
			return res.status(400).json({ error: "Postedby and text fields are required" });
		}

		const user = await User.findById(postedBy);
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		if (user._id.toString() !== req.user._id.toString()) {
			return res.status(401).json({ error: "Unauthorized to create post" });
		}

		const maxLength = 500;
		if (text.length > maxLength) {
			return res.status(400).json({ error: `Text must be less than ${maxLength} characters` });
		}

		// If multer provided a file, upload it to Cloudinary
		if (req.file) {
			const uploadOptions = {};
			if (req.file.mimetype && req.file.mimetype.startsWith("video")) {
				uploadOptions.resource_type = "video";
			}

			try {
				const uploadedResponse = await cloudinary.uploader.upload(req.file.path, uploadOptions);
				img = uploadedResponse.secure_url;
			} catch (uploadErr) {
				console.error("Cloudinary upload error:", uploadErr && uploadErr.message ? uploadErr.message : uploadErr);
				let friendly = "Failed to upload media.";
				if (uploadErr && uploadErr.message && uploadErr.message.toLowerCase().includes("invalid cloud_name")) {
					friendly = "Cloudinary configuration error: invalid cloud name. Check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in backend/.env.";
				}
				try { fs.unlinkSync(req.file.path); } catch (e) {}
				return res.status(500).json({ error: friendly });
			}

			// delete temp file
			try { fs.unlinkSync(req.file.path); } catch (e) {}
		}

		const newPost = new Post({ postedBy, text, img, mediaType: mediaType || (img && typeof img === 'string' && img.startsWith("data:video") ? "video" : (req.file && req.file.mimetype && req.file.mimetype.startsWith("video") ? "video" : "image")) });
		await newPost.save();

		res.status(201).json(newPost);
	} catch (err) {
		res.status(500).json({ error: err.message });
		console.log(err);
	}
};

const getPost = async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);

		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		// If the post author is private, only allow owner or followers to view
		const author = await User.findById(post.postedBy);
		if (author && author.isPrivate) {
			const viewerId = req.user?._id?.toString();
			const isOwner = viewerId && author._id.toString() === viewerId;
			// Private accounts: only the author may view their posts
			if (!isOwner) {
				return res.status(403).json({ error: "This user's posts are private" });
			}
		}

		res.status(200).json(post);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

const deletePost = async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);
		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		if (post.postedBy.toString() !== req.user._id.toString()) {
			return res.status(401).json({ error: "Unauthorized to delete post" });
		}

		if (post.img) {
			const imgId = post.img.split("/").pop().split(".")[0];
			await cloudinary.uploader.destroy(imgId);
		}

		await Post.findByIdAndDelete(req.params.id);

		res.status(200).json({ message: "Post deleted successfully" });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

const likeUnlikePost = async (req, res) => {
	try {
		const { id: postId } = req.params;
		const userId = req.user._id;

		const post = await Post.findById(postId);

		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		const userLikedPost = post.likes.includes(userId);

		if (userLikedPost) {
			// Unlike post
			await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
			res.status(200).json({ message: "Post unliked successfully" });
		} else {
			// Like post
			post.likes.push(userId);
			await post.save();
			res.status(200).json({ message: "Post liked successfully" });
		}
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

const replyToPost = async (req, res) => {
	try {
		const { text } = req.body;
		const postId = req.params.id;
		const userId = req.user._id;
		const userProfilePic = req.user.profilePic;
		const username = req.user.username;

		if (!text) {
			return res.status(400).json({ error: "Text field is required" });
		}

		const post = await Post.findById(postId);
		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		const reply = { userId, text, userProfilePic, username };

		post.replies.push(reply);
		await post.save();

		res.status(200).json(reply);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

const getFeedPosts = async (req, res) => {
	try {
		const userId = req.user._id;
		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		const following = Array.isArray(user.following) ? user.following.map((f) => f.toString()) : [];

		// Include all public users (isPrivate: false) and the viewer themself.
		// Private users should NOT appear in the feed even if followed — requirement: only author can view private posts.
		const publicUsers = await User.find({ isPrivate: false }).select("_id");
		const publicIds = publicUsers.map((u) => u._id.toString());

		const viewerId = userId.toString();
		const combinedIds = Array.from(new Set([viewerId, ...publicIds]));

		const feedPosts = await Post.find({ postedBy: { $in: combinedIds } }).sort({ createdAt: -1 });

		res.status(200).json(feedPosts);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

const getUserPosts = async (req, res) => {
	const { username } = req.params;
	try {
		const user = await User.findOne({ username });
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		// If the profile is private, only allow the owner to view their posts
		if (user.isPrivate) {
			const viewerId = req.user?._id?.toString();
			const isOwner = viewerId && user._id.toString() === viewerId;
			if (!isOwner) {
				return res.status(403).json({ error: "This user's posts are private" });
			}
		}

		const posts = await Post.find({ postedBy: user._id }).sort({ createdAt: -1 });

		res.status(200).json(posts);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

export { createPost, getPost, deletePost, likeUnlikePost, replyToPost, getFeedPosts, getUserPosts };

import User from "../models/userModel.js";
import Post from "../models/postModel.js";
import bcrypt from "bcryptjs";
import generateTokenAndSetCookie from "../utils/helpers/generateTokenAndSetCookie.js";
import crypto from "crypto";
import sendEmail from "../utils/helpers/sendEmail.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import mongoose from "mongoose";

const getUserProfile = async (req, res) => {
	// We will fetch user profile either with username or userId
	// query is either username or userId
	const { query } = req.params;

	try {
		let user;

		// query is userId
		if (mongoose.Types.ObjectId.isValid(query)) {
			user = await User.findOne({ _id: query }).select("-password").select("-updatedAt");
		} else {
			// query is username
			user = await User.findOne({ username: query }).select("-password").select("-updatedAt");
		}

		if (!user) return res.status(404).json({ error: "User not found" });

		res.status(200).json(user);
	} catch (err) {
		res.status(500).json({ error: err.message });
		console.log("Error in getUserProfile: ", err.message);
	}
};

const signupUser = async (req, res) => {
	try {
		const { name, email, username, password } = req.body;
		const user = await User.findOne({ $or: [{ email }, { username }] });

		if (user) {
			return res.status(400).json({ error: "User already exists" });
		}
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		// Create verification token
		const verificationToken = crypto.randomBytes(32).toString("hex");
		const verificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

		const newUser = new User({
			name,
			email,
			username,
			password: hashedPassword,
			verificationToken,
			verificationExpires,
		});
		await newUser.save();

		// Send verification email
		const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
		const verifyUrl = `${clientUrl}/verify/${verificationToken}`;
		const message = `Please verify your email by clicking the following link: ${verifyUrl}`;

		try {
			await sendEmail({
				to: newUser.email,
				subject: "Verify your email",
				text: message,
			});
		} catch (emailErr) {
			console.error("Error sending verification email", emailErr);
		}

		res.status(201).json({ message: "User created. Please check your email to verify your account." });
	} catch (err) {
		res.status(500).json({ error: err.message });
		console.log("Error in signupUser: ", err.message);
	}
};

const loginUser = async (req, res) => {
	try {
		const { username, password } = req.body;
		const user = await User.findOne({ username });
		const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");

		if (!user || !isPasswordCorrect) return res.status(400).json({ error: "Invalid username or password" });

		if (!user.isVerified) return res.status(400).json({ error: "Email not verified. Please check your email." });

		if (user.isFrozen) {
			user.isFrozen = false;
			await user.save();
		}

		generateTokenAndSetCookie(user._id, res);

		res.status(200).json({
			_id: user._id,
			name: user.name,
			email: user.email,
			username: user.username,
			bio: user.bio,
			profilePic: user.profilePic,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in loginUser: ", error.message);
	}
};

// Verify email via token
const verifyEmail = async (req, res) => {
	try {
		const { token } = req.params;
		if (!token) return res.status(400).json({ error: "Invalid or missing token" });

		const user = await User.findOne({ verificationToken: token, verificationExpires: { $gt: Date.now() } });
		if (!user) return res.status(400).json({ error: "Invalid or expired token" });

		user.isVerified = true;
		user.verificationToken = null;
		user.verificationExpires = null;
		await user.save();

		// Auto-login after verification
		generateTokenAndSetCookie(user._id, res);

		res.status(200).json({ message: "Email verified successfully", user: {
			_id: user._id,
			name: user.name,
			email: user.email,
			username: user.username,
			bio: user.bio,
			profilePic: user.profilePic,
		}});
	} catch (err) {
		res.status(500).json({ error: err.message });
		console.log("Error in verifyEmail: ", err.message);
	}
};

// Resend verification email
const resendVerification = async (req, res) => {
	try {
		const { email } = req.body;
		if (!email) return res.status(400).json({ error: "Email is required" });

		const user = await User.findOne({ email });
		if (!user) return res.status(400).json({ error: "User not found" });
		if (user.isVerified) return res.status(400).json({ error: "Email already verified" });

		const verificationToken = crypto.randomBytes(32).toString("hex");
		const verificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

		user.verificationToken = verificationToken;
		user.verificationExpires = verificationExpires;
		await user.save();

		const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
		const verifyUrl = `${clientUrl}/verify/${verificationToken}`;
		const message = `Please verify your email by clicking the following link: ${verifyUrl}`;

		try {
			await sendEmail({
				to: user.email,
				subject: "Verify your email",
				text: message,
			});
		} catch (emailErr) {
			console.error("Error sending verification email", emailErr);
		}

		res.status(200).json({ message: "Verification email resent" });
	} catch (err) {
		res.status(500).json({ error: err.message });
		console.log("Error in resendVerification: ", err.message);
	}
};

const logoutUser = (req, res) => {
	try {
		res.cookie("jwt", "", { maxAge: 1 });
		res.status(200).json({ message: "User logged out successfully" });
	} catch (err) {
		res.status(500).json({ error: err.message });
		console.log("Error in signupUser: ", err.message);
	}
};

const followUnFollowUser = async (req, res) => {
	try {
		const { id } = req.params;
		const userToModify = await User.findById(id);
		const currentUser = await User.findById(req.user._id);

		if (id === req.user._id.toString())
			return res.status(400).json({ error: "You cannot follow/unfollow yourself" });

		if (!userToModify || !currentUser) return res.status(400).json({ error: "User not found" });

		const isFollowing = currentUser.following.includes(id);

		if (isFollowing) {
			// Unfollow user
			await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
			await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });
			res.status(200).json({ message: "User unfollowed successfully" });
		} else {
			// Follow user
			await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
			await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });
			res.status(200).json({ message: "User followed successfully" });
		}
	} catch (err) {
		res.status(500).json({ error: err.message });
		console.log("Error in followUnFollowUser: ", err.message);
	}
};

const updateUser = async (req, res) => {
	const { name, email, username, password, bio } = req.body;
	let profilePic = req.body.profilePic; // fallback if client sends a URL

	const userId = req.user._id;
	try {
		let user = await User.findById(userId);
		if (!user) return res.status(400).json({ error: "User not found" });

		if (req.params.id !== userId.toString())
			return res.status(400).json({ error: "You cannot update other user's profile" });

		if (password) {
			const salt = await bcrypt.genSalt(10);
			const hashedPassword = await bcrypt.hash(password, salt);
			user.password = hashedPassword;
		}

		// If multer parsed a file, upload the file to Cloudinary
		if (req.file) {
			// delete previous image in Cloudinary if exists
			if (user.profilePic) {
				await cloudinary.uploader.destroy(user.profilePic.split("/").pop().split(".")[0]);
			}

			try {
				const uploadOptions = {};
				if (req.file.mimetype && req.file.mimetype.startsWith("video")) {
					uploadOptions.resource_type = "video";
				}

				const uploadedResponse = await cloudinary.uploader.upload(req.file.path, uploadOptions);
				profilePic = uploadedResponse.secure_url;
			} catch (uploadErr) {
				console.error("Cloudinary upload error (profilePic):", uploadErr && uploadErr.message ? uploadErr.message : uploadErr);
				let friendly = "Failed to upload profile picture.";
				if (uploadErr && uploadErr.message && uploadErr.message.toLowerCase().includes("invalid cloud_name")) {
					friendly = "Cloudinary configuration error: invalid cloud name. Check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in backend/.env.";
				}
				// Remove uploaded temp file if exists
				try { fs.unlinkSync(req.file.path); } catch (e) {}
				return res.status(500).json({ error: friendly });
			}

			// remove temp file
			try { fs.unlinkSync(req.file.path); } catch (e) {}
		}

		user.name = name || user.name;
		user.email = email || user.email;
		user.username = username || user.username;
		user.profilePic = profilePic || user.profilePic;
		user.bio = bio || user.bio;

		user = await user.save();

		// Find all posts that this user replied and update username and userProfilePic fields
		await Post.updateMany(
			{ "replies.userId": userId },
			{
				$set: {
					"replies.$[reply].username": user.username,
					"replies.$[reply].userProfilePic": user.profilePic,
				},
			},
			{ arrayFilters: [{ "reply.userId": userId }] }
		);

		// password should be null in response
		user.password = null;

		res.status(200).json(user);
	} catch (err) {
		res.status(500).json({ error: err.message });
		console.log("Error in updateUser: ", err.message);
	}
};

// Set account privacy (public/private)
const setPrivacy = async (req, res) => {
	try {
		const { isPrivate } = req.body;
		const userId = req.user._id;

		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ error: "User not found" });

		user.isPrivate = !!isPrivate;
		await user.save();

		// remove sensitive fields
		user.password = null;

		res.status(200).json({ message: "Privacy updated", user });
	} catch (err) {
		res.status(500).json({ error: err.message });
		console.log("Error in setPrivacy: ", err.message);
	}
};

const getSuggestedUsers = async (req, res) => {
	try {
		// exclude the current user from suggested users array and exclude users that current user is already following
		const userId = req.user._id;

		const usersFollowedByYou = await User.findById(userId).select("following");

		const users = await User.aggregate([
			{
				$match: {
					_id: { $ne: userId },
				},
			},
			{
				$sample: { size: 10 },
			},
		]);
		const filteredUsers = users.filter((user) => !usersFollowedByYou.following.includes(user._id));
		const suggestedUsers = filteredUsers.slice(0, 4);

		suggestedUsers.forEach((user) => (user.password = null));

		res.status(200).json(suggestedUsers);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

// Return a list of users that the authenticated user is following
const getFollowingUsers = async (req, res) => {
	try {
		const userId = req.user._id;
		const user = await User.findById(userId).select("following");
		if (!user) return res.status(404).json({ error: "User not found" });

		const followingIds = Array.isArray(user.following) ? user.following : [];

		const followingUsers = await User.find({ _id: { $in: followingIds } }).select("_id name username profilePic");

		// remove sensitive info if any
		followingUsers.forEach((u) => (u.password = null));

		res.status(200).json(followingUsers);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

const freezeAccount = async (req, res) => {
	try {
		const user = await User.findById(req.user._id);
		if (!user) {
			return res.status(400).json({ error: "User not found" });
		}

		user.isFrozen = true;
		await user.save();

		res.status(200).json({ success: true });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

// Search users by name or username
const searchUsers = async (req, res) => {
	try {
		const q = req.query.q || "";
		if (!q) return res.status(200).json([]);

		console.log("[searchUsers] query:", q);

		// case-insensitive partial match on name or username
		const regex = new RegExp(q, "i");
		const users = await User.find({ $or: [{ name: regex }, { username: regex }] })
			.select("_id name username profilePic")
			.limit(10);

		console.log("[searchUsers] found:", users.length);
		res.status(200).json(users);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

export {
	signupUser,
	loginUser,
	logoutUser,
	followUnFollowUser,
	updateUser,
	getUserProfile,
	getSuggestedUsers,
	getFollowingUsers,
	freezeAccount,
    verifyEmail,
    resendVerification,
	searchUsers,
    setPrivacy,
};

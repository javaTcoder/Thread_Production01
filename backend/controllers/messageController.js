import Conversation from "../models/conversationModel.js";
import Message from "../models/messageModel.js";
import { getRecipientSocketId, io } from "../socket/socket.js";
import { v2 as cloudinary } from "cloudinary";

async function sendMessage(req, res) {
	try {
		const { recipientId, message } = req.body;
		let { img } = req.body;
		const senderId = req.user._id;

		let conversation = await Conversation.findOne({
			participants: { $all: [senderId, recipientId] },
		});

		if (!conversation) {
			conversation = new Conversation({
				participants: [senderId, recipientId],
				lastMessage: {
					text: message,
					sender: senderId,
				},
			});
			await conversation.save();
		}

		if (img) {
			try {
				const uploadedResponse = await cloudinary.uploader.upload(img);
				img = uploadedResponse.secure_url;
			} catch (uploadErr) {
				console.error("Cloudinary upload error (message img):", uploadErr && uploadErr.message ? uploadErr.message : uploadErr);
				let friendly = "Failed to upload media.";
				if (uploadErr && uploadErr.message && uploadErr.message.toLowerCase().includes("invalid cloud_name")) {
					friendly = "Cloudinary configuration error: invalid cloud name. Check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in backend/.env.";
				}
				return res.status(500).json({ error: friendly });
			}
		}

		const newMessage = new Message({
			conversationId: conversation._id,
			sender: senderId,
			text: message,
			img: img || "",
		});

		await Promise.all([
			newMessage.save(),
			conversation.updateOne({
				lastMessage: {
					text: message,
					sender: senderId,
				},
			}),
		]);

		const recipientSocketId = getRecipientSocketId(recipientId);
		console.log("Attempting to send message", { recipientId, recipientSocketId });
		const messageToEmit = JSON.parse(JSON.stringify(newMessage));
		// If recipient socket exists, only send direct emit if recipient is NOT already in the room (avoid duplicate delivery)
		if (recipientSocketId) {
			const recipientSocket = io.sockets.sockets.get(recipientSocketId);
			const inRoom = recipientSocket && recipientSocket.rooms && recipientSocket.rooms.has(conversation._id.toString());
			if (!inRoom) {
				io.to(recipientSocketId).emit("newMessage", messageToEmit);
				console.log("Emitted newMessage to socket:", recipientSocketId);
			} else {
				console.log("Recipient socket already in room, skipping direct emit for:", recipientSocketId);
			}
		} else {
			console.log("Recipient socket not found for recipientId:", recipientId);
		}

		// also emit to conversation room so clients who joined the room receive it even if their socket id changed
		try {
			io.to(conversation._id.toString()).emit("newMessage", messageToEmit);
			console.log("Emitted newMessage to room:", conversation._id.toString());
		} catch (err) {
			console.log("Error emitting to room:", err && err.message ? err.message : err);
		}

		res.status(201).json(newMessage);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
}

async function getMessages(req, res) {
	const { otherUserId } = req.params;
	const userId = req.user._id;
	try {
		const conversation = await Conversation.findOne({
			participants: { $all: [userId, otherUserId] },
		});

		if (!conversation) {
			return res.status(404).json({ error: "Conversation not found" });
		}

		const messages = await Message.find({
			conversationId: conversation._id,
		}).sort({ createdAt: 1 });

		res.status(200).json(messages);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
}

async function getConversations(req, res) {
	const userId = req.user._id;
	try {
		const conversations = await Conversation.find({ participants: userId }).populate({
			path: "participants",
			select: "username profilePic",
		});

		// remove the current user from the participants array
		conversations.forEach((conversation) => {
			conversation.participants = conversation.participants.filter(
				(participant) => participant._id.toString() !== userId.toString()
			);
		});
		res.status(200).json(conversations);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
}

export { sendMessage, getMessages, getConversations };

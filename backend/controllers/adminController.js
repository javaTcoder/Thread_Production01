import User from "../models/userModel.js";
import Report from "../models/reportModel.js";
import { getOnlineUsers } from "../socket/socket.js";

export const getStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const onlineUsers = getOnlineUsers();
        // Active users: users updated in the last 7 days
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const activeUsersCount = await User.countDocuments({ updatedAt: { $gte: sevenDaysAgo } });

        const reports = await Report.find().sort({ createdAt: -1 }).limit(50).populate("reporter", "username name").populate("reportedUser", "username name");

        res.json({
            totalUsers,
            onlineUsersCount: onlineUsers.length,
            onlineUsers,
            activeUsersCount,
            reports,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const createReport = async (req, res) => {
    try {
        const { reporter, reportedUser, reason, meta } = req.body;
        if (!reporter || !reportedUser) return res.status(400).json({ message: "Missing fields" });
        const report = await Report.create({ reporter, reportedUser, reason, meta });
        res.status(201).json(report);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const resolveReport = async (req, res) => {
    try {
        const { id } = req.params;
        const report = await Report.findByIdAndUpdate(id, { resolved: true }, { new: true });
        res.json(report);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

import mongoose from "mongoose";

const reportSchema = mongoose.Schema(
    {
        reporter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        reportedUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        reason: {
            type: String,
            default: "",
        },
        resolved: {
            type: Boolean,
            default: false,
        },
        meta: {
            type: Object,
            default: {},
        },
    },
    { timestamps: true }
);

const Report = mongoose.model("Report", reportSchema);

export default Report;

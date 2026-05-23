const mongoose = require("mongoose");

const HistorySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        date: {
            type: Date,
            default: Date.now,
        },
        mode: {
            type: String,
            default: "",
            trim: true,
        },
        company: {
            type: String,
            default: "",
            trim: true,
        },
        jobRole: {
            type: String,
            default: "",
            trim: true,
        },
        level: {
            type: String,
            default: "",
            trim: true,
        },
        focusArea: {
            type: String,
            default: "",
            trim: true,
        },
        track: {
            type: String,
            default: "",
            trim: true,
        },
        mbaSpecialization: {
            type: String,
            default: "",
            trim: true,
        },
        text: {
            type: String,
            default: "",
            trim: true,
        },
        score: {
            type: Number,
        },
    },
    {
        timestamps: true,
    }
);

const HistoryModel = mongoose.model("History", HistorySchema);

module.exports = HistoryModel;

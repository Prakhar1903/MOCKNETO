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
        // DSA Coding Round fields
        dsaMode: { type: Boolean, default: false },
        dsaProblem: { type: String, default: "", trim: true },
        userCode: { type: String, default: "", trim: true },
        language: { type: String, default: "", trim: true },
        testsPassed: { type: Number },
        testsTotal: { type: Number },
        codeScore: { type: Number },
        // New fields for structured session review
        interviewer: { type: String, default: "" },
        duration: { type: Number },
        overallFeedback: { type: String, default: "" },
        studyRecommendations: [{ type: String }],
        questions: [{
            questionText: { type: String, required: true },
            answerText: { type: String, default: "" },
            verdict: { type: String, default: "" },
            aiFeedback: { type: String, default: "" },
            score: { type: Number },
            improvedAnswer: { type: String, default: "" },
        }],
        startedAt: { type: Date },
        endedAt: { type: Date },
    },
    {
        timestamps: true,
    }
);

const HistoryModel = mongoose.model("History", HistorySchema);

// Compound index for fast percentile queries (rolling 7-day window by track/focusArea)
HistorySchema.index({ track: 1, focusArea: 1, date: -1, score: 1 });

module.exports = HistoryModel;

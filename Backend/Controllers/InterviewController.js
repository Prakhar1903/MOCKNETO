const interviewService = require("../Services/InterviewService");
const AppError = require("../Utils/AppError");
const UserModel = require("../Models/user");
const HistoryModel = require("../Models/history");
const { callGeminiText } = require("../ai/gemini");
const { buildReplayCommentaryPrompt } = require("../ai/prompts");

const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};

exports.getQuestions = catchAsync(async (req, res) => {
    // If resume-based questions are requested, inject the user's resumeText
    if (req.body.useResumeQuestions) {
        const user = await UserModel.findById(req.userId).select("resumeText");
        req.body.resumeText = user?.resumeText || "";
    }
    const result = await interviewService.getQuestions(req.body);
    res.status(200).json(result);
});

exports.checkAnswer = catchAsync(async (req, res) => {
    const result = await interviewService.checkAnswer(req.body);
    res.status(200).json(result);
});

exports.getFeedback = catchAsync(async (req, res) => {
    const result = await interviewService.getFeedback(req.body);
    res.status(200).json(result);
});

exports.getHistory = catchAsync(async (req, res) => {
    const history = await interviewService.getHistory(req.userId);
    res.status(200).json({ history });
});

exports.getSessionById = catchAsync(async (req, res) => {
    const session = await HistoryModel.findOne({ _id: req.params.id, userId: req.userId });
    if (!session) return res.status(404).json({ message: "Session not found" });
    res.status(200).json({ session });
});

const userService = require("../Services/UserService");

exports.saveHistory = catchAsync(async (req, res) => {
    const result = await interviewService.saveHistory(req.userId, req.body);
    // Update streak when a session is saved
    await userService.updateStreak(req.userId);
    res.status(200).json(result);
});

exports.clearHistory = catchAsync(async (req, res) => {
    const result = await interviewService.clearHistory(req.userId);
    res.status(200).json(result);
});

exports.getLeaderboard = catchAsync(async (req, res) => {
    const leaderboard = await HistoryModel.aggregate([
        {
            $group: {
                _id: "$userId",
                avgScore: { $avg: "$score" },
                totalSessions: { $sum: 1 },
                bestScore: { $max: "$score" },
            },
        },
        { $sort: { avgScore: -1 } },
        { $limit: 20 },
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "user",
            },
        },
        { $unwind: "$user" },
        {
            $project: {
                userName: "$user.UserName",
                profileImage: "$user.profileImage",
                avgScore: { $round: ["$avgScore", 1] },
                totalSessions: 1,
                bestScore: 1,
            },
        },
    ]);
    res.status(200).json({ leaderboard });
});

// ─── Peer Comparison Percentile ───────────────────────────────────────────────
exports.getPercentile = catchAsync(async (req, res) => {
    const { score, focusArea, track } = req.query;
    const userScore = parseFloat(score);
    if (isNaN(userScore)) {
        return res.status(400).json({ message: "score query parameter is required" });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const matchFilter = { date: { $gte: sevenDaysAgo }, score: { $exists: true, $ne: null } };
    if (track) matchFilter.track = track;
    if (focusArea) matchFilter.focusArea = focusArea;

    const [totalCount, belowCount] = await Promise.all([
        HistoryModel.countDocuments(matchFilter),
        HistoryModel.countDocuments({ ...matchFilter, score: { $lt: userScore } }),
    ]);

    const MIN_SESSIONS = 50;
    if (totalCount < MIN_SESSIONS) {
        return res.status(200).json({
            hasData: false,
            totalSessions: totalCount,
            minRequired: MIN_SESSIONS,
            message: "Not enough data yet — check back soon.",
        });
    }

    const percentile = Math.round((belowCount / totalCount) * 100);
    return res.status(200).json({
        hasData: true,
        percentile,         // % of users you beat
        rank: 100 - percentile, // top X% label
        totalSessions: totalCount,
        track: track || "all",
        focusArea: focusArea || "all",
    });
});

// ─── Replay Commentary ────────────────────────────────────────────────────────
exports.replayCommentary = catchAsync(async (req, res) => {
    const { pairs } = req.body;
    if (!Array.isArray(pairs) || pairs.length === 0) {
        return res.status(400).json({ message: "pairs array is required" });
    }
    // Cap at 10 pairs to control cost
    const cappedPairs = pairs.slice(0, 10);

    const prompt = buildReplayCommentaryPrompt({ pairs: cappedPairs });
    try {
        const ai = await callGeminiText({ prompt, temperature: 0.4, maxOutputTokens: 1200 });
        if (ai.ok && ai.text) {
            let jsonText = ai.text.trim();
            if (jsonText.startsWith("```")) {
                jsonText = jsonText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
            }
            try {
                const commentary = JSON.parse(jsonText);
                // Pad with fallback if AI returned fewer items than pairs
                while (commentary.length < cappedPairs.length) {
                    commentary.push({
                        good: "Your answer showed some understanding of the topic.",
                        missed: "A more detailed and structured response would strengthen this answer.",
                        tip: "Use the STAR method: Situation → Task → Action → Result.",
                    });
                }
                return res.status(200).json({ commentary: commentary.slice(0, cappedPairs.length) });
            } catch (parseErr) {
                console.error("Replay commentary JSON parse error:", parseErr.message);
            }
        }
    } catch (err) {
        console.error("Replay commentary AI error:", err.message);
    }

    // Fallback: generate commentary from the existing verdict data
    const fallbackCommentary = cappedPairs.map((p) => {
        const v = String(p.verdict || "").toLowerCase();
        return {
            good: v === "strong"
                ? "You provided a well-structured and complete answer."
                : v === "okay"
                ? "Your answer covered the basics and showed understanding."
                : "You attempted the question and provided some context.",
            missed: v === "strong"
                ? "Adding a specific metric or example would make this answer exceptional."
                : v === "okay"
                ? "The answer lacked depth — add a concrete example or trade-off."
                : "The answer was too brief. Aim for at least 5-8 lines with an example.",
            tip: "Structure answers clearly: define → example → trade-off → summary.",
        };
    });
    return res.status(200).json({ commentary: fallbackCommentary });
});

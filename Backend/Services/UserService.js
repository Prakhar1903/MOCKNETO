const User = require("../Models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const AppError = require("../Utils/AppError");
const HistoryModel = require("../Models/history");

const JWT_SECRET = process.env.JWT_SECRET || "myverysecretkey123";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";

const googleClient = GOOGLE_CLIENT_ID
    ? new OAuth2Client(GOOGLE_CLIENT_ID)
    : null;

const generateToken = (userId) => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "1d" });
};

const sanitizeNameFromEmail = (email) => {
    const local = String(email || "").split("@")[0] || "User";
    return local.replace(/[^a-z0-9._-]/gi, "").slice(0, 24) || "User";
};

exports.registerUser = async (userData) => {
    const { UserName, Email, Password } = userData;

    const existingUser = await User.findOne({ Email });
    if (existingUser) {
        throw new AppError("Email already registered", 409);
    }

    const hashedPassword = await bcrypt.hash(Password, 10);

    const user = await User.create({
        UserName,
        Email,
        Password: hashedPassword,
    });

    const token = generateToken(user._id);
    return { user, token };
};

exports.loginUser = async (Email, Password) => {
    const user = await User.findOne({ Email });
    if (!user) {
        throw new AppError("Invalid email or password", 401);
    }

    const isMatch = await bcrypt.compare(Password, user.Password);
    if (!isMatch) {
        throw new AppError("Invalid email or password", 401);
    }

    const token = generateToken(user._id);
    return { user, token };
};

exports.googleLogin = async (idToken) => {
    if (!googleClient) {
        throw new AppError(
            "Google login is not configured. Missing GOOGLE_CLIENT_ID",
            500,
        );
    }

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: String(idToken),
            audience: GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload() || {};
        const email = String(payload.email || "")
            .toLowerCase()
            .trim();
        const emailVerified = Boolean(payload.email_verified);
        const name = String(payload.name || "").trim();
        const picture = String(payload.picture || "").trim();

        if (!email) {
            throw new AppError("Google token missing email", 401);
        }
        if (!emailVerified) {
            throw new AppError("Google email is not verified", 401);
        }

        let user = await User.findOne({ Email: email });
        if (!user) {
            const randomPassword = crypto.randomBytes(32).toString("hex");
            const hashedPassword = await bcrypt.hash(randomPassword, 10);
            user = await User.create({
                UserName: name || sanitizeNameFromEmail(email),
                Email: email,
                Password: hashedPassword,
                profileImage: picture || "",
            });
        } else if (picture && !user.profileImage) {
            user.profileImage = picture;
            await user.save();
        }

        const token = generateToken(user._id);
        return { user, token };
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError("Invalid Google token", 401);
    }
};

exports.getUserById = async (userId, includeHistory = false) => {
    const user = await User.findById(userId).select("-Password").lean();
    if (!user) throw new AppError("User not found", 404);

    if (includeHistory) {
        user.interviewHistory = await HistoryModel.find({ userId })
            .sort({ date: -1 })
            .limit(50);
    }

    return user;
};

exports.updateUser = async (userId, updateData) => {
    const { UserName, Email, Password, profileImage, settings } = updateData;
    const updates = {};

    if (typeof UserName === "string") updates.UserName = UserName;
    if (typeof Email === "string") updates.Email = Email;
    if (typeof profileImage === "string") updates.profileImage = profileImage;

    if (settings && typeof settings === "object") {
        if ("theme" in settings) {
            const t = String(settings.theme);
            if (!["light", "dark", "system"].includes(t)) {
                throw new AppError("Invalid theme", 400);
            }
            updates["settings.theme"] = t;
        }

        if ("emailNotifications" in settings) {
            updates["settings.emailNotifications"] = Boolean(
                settings.emailNotifications,
            );
        }

        if ("defaultDifficulty" in settings) {
            const d = String(settings.defaultDifficulty);
            if (!["Easy", "Medium", "Hard"].includes(d)) {
                throw new AppError("Invalid default difficulty", 400);
            }
            updates["settings.defaultDifficulty"] = d;
        }

        if ("preferredLanguage" in settings) {
            updates["settings.preferredLanguage"] = String(
                settings.preferredLanguage,
            );
        }

        if ("autoPlayVoice" in settings) {
            updates["settings.autoPlayVoice"] = Boolean(settings.autoPlayVoice);
        }
    }

    if (Password) {
        if (String(Password).length < 6) {
            throw new AppError("Password must be at least 6 characters", 400);
        }
        updates.Password = await bcrypt.hash(String(Password), 10);
    }

    try {
        const user = await User.findByIdAndUpdate(userId, updates, {
            new: true,
            runValidators: true,
        }).select("-Password");

        if (!user) throw new AppError("User not found", 404);
        return user;
    } catch (error) {
        if (error.code === 11000) {
            throw new AppError("Email already registered", 409);
        }
        throw error;
    }
};

const userService = require("../Services/UserService");

// Helper to catch async errors
const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};

const setTokenCookie = (res, token) => {
    const isProduction = process.env.NODE_ENV === "production";
    const cookieOptions = {
        expires: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "strict" : "lax",
    };
    res.cookie("token", token, cookieOptions);
};

exports.createUser = catchAsync(async (req, res, next) => {
    const { user, token } = await userService.registerUser(req.body);

    // Send verification email asynchronously so it doesn't block signup
    userService.sendVerificationEmail(user).catch(console.error);

    setTokenCookie(res, token);

    res.status(201).json({
        success: true,
        message: "User registered successfully",
        token,
        user: {
            _id: user._id,
            UserName: user.UserName,
            Email: user.Email,
            profileImage: user.profileImage || "",
            settings: user.settings || {},
            createdAt: user.createdAt,
        },
    });
});

exports.loginUser = catchAsync(async (req, res, next) => {
    const { Email, Password } = req.body;
    const { user, token } = await userService.loginUser(Email, Password);

    setTokenCookie(res, token);

    res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        user: {
            _id: user._id,
            UserName: user.UserName,
            Email: user.Email,
            profileImage: user.profileImage || "",
            settings: user.settings || {},
            createdAt: user.createdAt,
        },
    });
});

exports.googleLogin = catchAsync(async (req, res, next) => {
    const { idToken } = req.body;
    const { user, token } = await userService.googleLogin(idToken);

    setTokenCookie(res, token);

    res.status(200).json({
        success: true,
        message: "Google login successful",
        token,
        user: {
            _id: user._id,
            UserName: user.UserName,
            Email: user.Email,
            profileImage: user.profileImage || "",
            settings: user.settings || {},
            createdAt: user.createdAt,
        },
    });
});

exports.getMe = catchAsync(async (req, res, next) => {
    const user = await userService.getUserById(req.userId, true);

    res.status(200).json({
        success: true,
        user,
    });
});

exports.updateMe = catchAsync(async (req, res, next) => {
    const user = await userService.updateUser(req.userId, req.body);

    res.status(200).json({
        success: true,
        message: "Profile updated",
        user,
    });
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }
    const result = await userService.forgotPassword(email);
    res.status(200).json(result);
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
    }
    const result = await userService.resetPassword(token, newPassword);
    res.status(200).json(result);
});

exports.verifyEmail = catchAsync(async (req, res, next) => {
    const { token } = req.body;
    if (!token) {
        return res.status(400).json({ message: "Token is required" });
    }
    const result = await userService.verifyEmail(token);
    res.status(200).json(result);
});

const { PDFParse } = require("pdf-parse");

exports.uploadResume = catchAsync(async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ message: "No resume file uploaded" });
    }

    try {
        // Parse the PDF
        const parser = new PDFParse({ data: req.file.buffer });
        const data = await parser.getText();
        await parser.destroy();
        const resumeText = data.text;

        // Save parsed text to the user's profile
        // Get user from DB directly since userService.getUserById doesn't return full model instance? 
        // Let's check how userService is exported. Actually userService.getUserById returns a user object.
        // Wait, let's just use the User model directly if needed, or pass via userService.
        const User = require("../Models/user");
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.resumeText = resumeText;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Resume uploaded and parsed successfully",
            resumeTextPreview: resumeText.substring(0, 200) + "..."
        });
    } catch (err) {
        console.error("PDF Parsing error:", err);
        return res.status(500).json({ message: "Failed to parse resume" });
    }
});

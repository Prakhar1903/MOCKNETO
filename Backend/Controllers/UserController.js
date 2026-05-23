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

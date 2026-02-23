const userService = require("../Services/UserService");

// Helper to catch async errors
const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};

exports.createUser = catchAsync(async (req, res, next) => {
    const { user, token } = await userService.registerUser(req.body);

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
    const user = await userService.getUserById(req.userId);

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

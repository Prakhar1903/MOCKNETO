# Mockneto Feature Implementation Plan

Priority order and integration details for 10 missing features.

## Priority Order

| # | Feature | Effort | Impact |
|---|---|---|---|
| 1 | Streak (Real DB) | 1 hour | High — UI already exists |
| 2 | Forgot Password | 2 hours | High — Mailtrap already set up |
| 3 | Email Verification | 2 hours | Medium |
| 4 | Leaderboard | 3 hours | High — impressive for demo |
| 5 | Resume Upload & Parse | 4 hours | High — AI feature |
| 6 | Code Editor (DSA) | 4 hours | High — big differentiator |
| 7 | Share Results/Scorecard | 3 hours | Medium |
| 8 | Push Notifications | 3 hours | Medium |
| 9 | Peer Mock Interviews | 8 hours | High — complex WebRTC |
| 10 | Subscription/Payments | 8 hours | Low for now |

---

## 1. Streak (Real Backend Data)
UI already shows streak in Reports.jsx — just not connected to real data.

### Backend/Models/user.js — Add fields
```js
streak: {
  current: { type: Number, default: 0 },
  longest: { type: Number, default: 0 },
  lastActivityDate: { type: Date, default: null },
},
totalSessions: { type: Number, default: 0 },
```

### Backend/Services/UserService.js — Add updateStreak
```js
exports.updateStreak = async (userId) => {
  const user = await User.findById(userId);
  const today = new Date().toDateString();
  const lastDate = user.streak.lastActivityDate
    ? new Date(user.streak.lastActivityDate).toDateString() : null;

  if (lastDate === today) return user;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  user.streak.current = lastDate === yesterday.toDateString()
    ? user.streak.current + 1 : 1;
  user.streak.longest = Math.max(user.streak.current, user.streak.longest);
  user.streak.lastActivityDate = new Date();
  user.totalSessions += 1;
  return user.save();
};
```

### Backend/Controllers/InterviewController.js — Call after saveHistory
```js
await require('../Services/UserService').updateStreak(req.user._id);
```

### Frontend: src/Pages/Reports.jsx — Replace mock data
```js
API.get('/users/me').then(r => setStreak(r.data.user.streak));
```

---

## 2. Forgot Password / Reset
Mailtrap + crypto already imported in UserService.

### Backend/Models/user.js — Add fields
```js
resetPasswordToken: { type: String, default: null },
resetPasswordExpires: { type: Date, default: null },
```

### Backend/Services/UserService.js — Add 2 functions
```js
exports.forgotPassword = async (email) => {
  const user = await User.findOne({ Email: email.toLowerCase() });
  if (!user) throw new AppError('No account found', 404);
  const token = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
  await user.save();
  const resetUrl = `${process.env.FRONTEND_ORIGIN}/reset-password/${token}`;
  // nodemailer: send resetUrl via MAILTRAP_* env vars
};

exports.resetPassword = async (token, newPassword) => {
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpires: { $gt: Date.now() }
  });
  if (!user) throw new AppError('Token invalid or expired', 400);
  user.Password = await bcrypt.hash(newPassword, 10);
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  return user.save();
};
```

### Backend/Route/UserRoutes.js — Add routes (before requireAuth)
```js
router.post("/forgot-password", userController.forgotPassword);
router.post("/reset-password/:token", userController.resetPassword);
```

### New Frontend Files
- src/Pages/ForgotPassword.jsx — Email input form, same glass-card style as Login.jsx
- src/Pages/ResetPassword.jsx — Gets token from useParams(), new + confirm password inputs

### src/App.jsx — Add inside MainLayout children
```jsx
{ path: "/forgot-password", element: <ForgotPassword /> },
{ path: "/reset-password/:token", element: <ResetPassword /> },
```

### src/components/Login.jsx — Add link under password field
```jsx
<Link to="/forgot-password" className="text-violet-400 text-sm hover:underline">
  Forgot password?
</Link>
```

---

## 3. Email Verification on Signup

### Backend/Models/user.js — Add fields
```js
isEmailVerified: { type: Boolean, default: false },
emailVerifyToken: { type: String, default: null },
```

### Backend/Services/UserService.js — After user.create() in registerUser
```js
const verifyToken = crypto.randomBytes(32).toString('hex');
user.emailVerifyToken = verifyToken;
await user.save();
// send email: FRONTEND_ORIGIN/verify-email/${verifyToken}
```

### Backend: Add verifyEmail function + GET route
```js
// Backend/Services/UserService.js
exports.verifyEmail = async (token) => {
  const user = await User.findOne({ emailVerifyToken: token });
  if (!user) throw new AppError('Invalid token', 400);
  user.isEmailVerified = true;
  user.emailVerifyToken = null;
  await user.save();
};

// Backend/Route/UserRoutes.js
router.get("/verify-email/:token", userController.verifyEmail);
```

### New Frontend: src/Pages/VerifyEmail.jsx
- useParams() to get token
- Call API.get('/users/verify-email/:token') on mount
- Show success tick or error message

### src/App.jsx — Add inside MainLayout
```jsx
{ path: "/verify-email/:token", element: <VerifyEmail /> }
```

---

## 4. Leaderboard

### Backend/Route/InterviewRoutes.js
```js
router.get("/leaderboard", interviewController.getLeaderboard);
```

### Backend/Controllers/InterviewController.js
```js
exports.getLeaderboard = catchAsync(async (req, res) => {
  const data = await HistoryModel.aggregate([
    { $group: {
        _id: "$userId",
        avgScore: { $avg: "$score" },
        totalSessions: { $sum: 1 },
        bestScore: { $max: "$score" }
    }},
    { $sort: { avgScore: -1 } },
    { $limit: 20 },
    { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" }},
    { $unwind: "$user" },
    { $project: {
        userName: "$user.UserName",
        profileImage: "$user.profileImage",
        avgScore: { $round: ["$avgScore", 1] },
        totalSessions: 1,
        bestScore: 1
    }}
  ]);
  res.json({ leaderboard: data });
});
```

### New Frontend: src/Pages/Leaderboard.jsx
- API.get('/api/interviews/leaderboard') on mount
- Ranked rows: gold/silver/bronze medals for top 3
- Current user row highlighted in violet
- framer-motion staggered row animation
- Columns: Rank | User | Avg Score | Sessions | Best Score

### src/App.jsx — Add inside DashboardLayout
```jsx
{ path: "/leaderboard", element: <Leaderboard /> }
```

### src/components/DashboardLayout.jsx — Add to sidebar
```jsx
{ icon: "leaderboard", label: "Leaderboard", path: "/leaderboard" }
```

---

## 5. Resume Upload & Parse

### Install
```bash
cd Backend && npm install multer pdf-parse
```

### New Backend/Utils/multerConfig.js
```js
const multer = require('multer');
module.exports = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    file.mimetype === 'application/pdf' ? cb(null, true) : cb(new Error('PDF only'))
});
```

### Backend/Route/UserRoutes.js
```js
const upload = require('../Utils/multerConfig');
router.post("/resume/parse", requireAuth, upload.single('resume'), userController.parseResume);
```

### Backend/Controllers/UserController.js
```js
exports.parseResume = catchAsync(async (req, res) => {
  const pdf = await require('pdf-parse')(req.file.buffer);
  const prompt = `Extract JSON {skills, jobRole, experience, focusAreas} from: ${pdf.text.slice(0,3000)}`;
  const result = await require('../ai/gemini').generateContent(prompt);
  res.json({ parsed: JSON.parse(result) });
});
```

### Frontend: src/Pages/InterviewSetup.jsx
- Add dashed-border PDF drag-drop zone at top of page
- POST to /api/users/resume/parse
- Auto-fill company, jobRole, focusArea fields
- Show skill chips extracted by AI

---

## 6. Code Editor for DSA Rounds

### Install
```bash
cd ai-based-project && npm install @monaco-editor/react
```

### New Frontend: src/Pages/CodeInterview.jsx
Split-panel layout:
- Left 40%: DSA question + difficulty badge + AI Hint button
- Right 60%: Monaco Editor (vs-dark) + language dropdown + Submit to AI Review button + AI feedback below

```jsx
import Editor from '@monaco-editor/react';

<Editor
  height="400px"
  defaultLanguage="javascript"
  theme="vs-dark"
  value={code}
  onChange={setCode}
  options={{ fontSize: 14, minimap: { enabled: false } }}
/>
```

AI review: POST to existing /api/interviews/check-answer endpoint with {question, answer: code}.

### src/App.jsx — Add inside DashboardLayout
```jsx
{ path: "/code-interview", element: <CodeInterview /> }
```

### src/Pages/InterviewSetup.jsx — Add 5th mode card
Add "Coding Round" card with cyan color, code icon, routes to /code-interview.

---

## 7. Share Results / Scorecard

### Install
```bash
cd ai-based-project && npm install html2canvas
```

### New Frontend: src/components/Scorecard.jsx
Hidden off-screen div captured by html2canvas:
- Violet gradient background
- Mockneto logo + "Interview Performance"
- User name, company, role, score, mode, difficulty, date
- CloudFront URL at bottom

### src/Pages/Reports.jsx — Add share button per session
```js
import html2canvas from 'html2canvas';

const shareSession = async () => {
  const canvas = await html2canvas(scorecardRef.current);
  const link = document.createElement('a');
  link.download = `mockneto-score.png`;
  link.href = canvas.toDataURL();
  link.click();
};
```

---

## 8. Push Notifications

### New Frontend: src/utils/notifications.js
```js
export const requestPermission = async () => {
  if (!('Notification' in window)) return false;
  return (await Notification.requestPermission()) === 'granted';
};

export const notify = (title, body) => {
  if (Notification.permission === 'granted')
    new Notification(title, { body, icon: '/vite.svg' });
};
```

### Trigger points
- After any interview ends: notify('Done! Score: X/100')
- On app load if streak at risk: notify('Keep your streak alive!')

### src/Pages/Settings.jsx — Add toggle
Uses existing Toggle pattern in Settings to enable/disable reminders.
On enable: calls requestPermission(), saves preference to API.

---

## 9. Peer Mock Interviews

### Install
```bash
cd Backend && npm install socket.io
cd ai-based-project && npm install socket.io-client
```

### Backend/app.js — Wrap express with Socket.io
```js
const { createServer } = require('http');
const { Server } = require('socket.io');
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: process.env.FRONTEND_ORIGIN }});

io.on('connection', socket => {
  socket.on('join-room', roomId => {
    socket.join(roomId);
    socket.to(roomId).emit('peer-joined');
  });
  socket.on('offer',         d => socket.to(d.roomId).emit('offer', d.offer));
  socket.on('answer',        d => socket.to(d.roomId).emit('answer', d.answer));
  socket.on('ice-candidate', d => socket.to(d.roomId).emit('ice-candidate', d.candidate));
});

httpServer.listen(PORT); // replaces app.listen(PORT)
```

### New Frontend: src/Pages/PeerInterview.jsx
Flow:
1. Create room → 6-char code displayed to share
2. Partner enters code → both connect via WebRTC
3. Roles: Interviewer sees question bank, Candidate answers
4. AI evaluates candidate answers at end

### src/App.jsx — Add routes inside DashboardLayout
```jsx
{ path: "/peer-interview",         element: <PeerInterview /> },
{ path: "/peer-interview/:roomId", element: <PeerInterview /> },
```

---

## 10. Subscription / Payment Plans

### Install
```bash
cd Backend && npm install stripe
```

### Backend/Models/user.js — Add fields
```js
plan: { type: String, enum: ['free', 'pro'], default: 'free' },
planExpiresAt: { type: Date, default: null }
```

### New Backend/Route/PaymentRoutes.js
```js
router.post('/create-checkout', requireAuth, paymentController.createCheckout);
router.post('/webhook', express.raw({type:'application/json'}), paymentController.handleWebhook);
```

### Free vs Pro
| Feature | Free | Pro ($9/mo) |
|---|---|---|
| AI interviews/day | 5 | Unlimited |
| Video analysis | No | Yes |
| Resume parsing | No | Yes |
| Code editor | No | Yes |
| Leaderboard rank | View | Ranked |

### New Frontend: src/Pages/Pricing.jsx
Two glassmorphism cards side by side.
Pro card has violet glow border, "Most Popular" badge, Stripe checkout button.
Add as public route in MainLayout: { path: "/pricing", element: <Pricing /> }

---

## Files Summary

### New Backend Files
```
Backend/Utils/multerConfig.js
Backend/Route/PaymentRoutes.js
```

### Modified Backend Files
```
Backend/Models/user.js                  <- streak, resetToken, verifyToken, plan fields
Backend/Services/UserService.js         <- forgotPassword, resetPassword, verifyEmail, updateStreak
Backend/Controllers/UserController.js   <- parseResume, forgotPassword, resetPassword, verifyEmail
Backend/Controllers/InterviewController.js <- getLeaderboard, updateStreak in saveHistory
Backend/Route/UserRoutes.js             <- 5 new routes
Backend/Route/InterviewRoutes.js        <- /leaderboard route
Backend/app.js                          <- Socket.io for peer interviews
```

### New Frontend Files
```
src/Pages/ForgotPassword.jsx
src/Pages/ResetPassword.jsx
src/Pages/VerifyEmail.jsx
src/Pages/Leaderboard.jsx
src/Pages/CodeInterview.jsx
src/Pages/PeerInterview.jsx
src/Pages/Pricing.jsx
src/components/Scorecard.jsx
src/utils/notifications.js
```

### Modified Frontend Files
```
src/App.jsx                           <- 8+ new routes
src/components/Login.jsx              <- "Forgot password?" link
src/Pages/InterviewSetup.jsx          <- Resume upload + Code mode card
src/Pages/Reports.jsx                 <- Real streak API + Share button
src/Pages/Settings.jsx                <- Notification toggle
src/components/DashboardLayout.jsx    <- Leaderboard in sidebar nav
```

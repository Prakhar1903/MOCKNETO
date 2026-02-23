# 🎯 Mockneto: AI-Powered Interview Preparation Platform

Mockneto is a state-of-the-art platform designed to revolutionize the way candidates prepare for interviews. By leveraging the power of Gemini AI, Mockneto provides realistic, interactive mock interview sessions, real-time feedback, and comprehensive progress tracking.

---

## ✨ Key Features

- **🤖 AI-Driven Interviews**: Interactive mock interviews tailored to Tech and MBA tracks, powered by Google's Gemini AI.
- **📈 Progress Dashboard**: Visualize your growth with detailed analytics and score trends over time.
- **🔐 Secure Authentication**: Robust user management with optional Google OAuth integration.
- **🎙️ Real-time Feedback**: Instant AI-generated analysis of performance and areas for improvement.
- **📹 Multimedia Support**: Choose between Chat, Video, and Voice-based interview formats.

---

## 🏗️ Project Structure

Mockneto is organized as a monorepo:

- **[Backend](file:///home/prakhar/Mockneto/Backend)**: Node.js/Express server handling AI orchestration, user management, and data persistence.
- **[ai-based-project (Frontend)](file:///home/prakhar/Mockneto/ai-based-project)**: React/Vite/Tailwind frontend for the interview experience.

---

## 🛠️ Technology Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | React, Vite, Tailwind CSS, Framer Motion |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Mongoose ODM) |
| **AI Engine** | Gemini AI (Google Generative AI) |

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- MongoDB connection string
- Gemini AI API Key

### 2. Quick Installation
From the root directory, run:
```bash
npm run install:all
```
This will install dependencies for the root, backend, and frontend.

### 3. Environment Setup
Create a `.env` file in the `Backend` directory:
```env
PORT=5600
MONGO_URI=your_mongodb_uri
GEMINI_API_KEY=your_api_key
JWT_SECRET=your_secret_key
GOOGLE_CLIENT_ID=your_google_client_id (optional)
```

### 4. Running the Project
#### Development Mode
To start both the backend and frontend concurrently:
```bash
npm run dev
```
- Backend will start on `http://localhost:5600`
- Frontend will start on `http://localhost:5173`

#### Production Mode
Or start them individually:
```bash
# Backend
cd Backend && npm start

# Frontend
cd ai-based-project && npm run dev
```

---

## 🗺️ Frontend Routes
- `/interviewsetup`: Entry point to choose interview type.
- `/chat-interview`: Text-based AI interaction.
- `/video-interview`: Video-based mock interview.
- `/voice-interview`: Speech-to-text enabled interview with TTS support.
- `/question`: Access the comprehensive Question Bank.
- `/dashboard`: View your performance reports.

---

## 🤝 Contributing
We welcome contributions! Please follow the established **Service/Controller** pattern on the backend and maintain the design system in the frontend.

---

## 📄 License
This project is licensed under the MIT License.
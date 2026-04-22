# ♻️ WasteWise — Smart Waste Management System

> A full-stack web application that connects citizens and pickup agents to manage waste collection efficiently, with gamification, real-time tracking, and a verification-based completion flow.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [User Roles](#user-roles)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Pickup Completion Flow](#pickup-completion-flow)
- [Gamification System](#gamification-system)

---

## 🌍 Overview

WasteWise is a smart waste management platform that allows citizens to schedule waste pickups, pickup agents to manage and complete those pickups The system uses a **verification code flow** to ensure pickups are completed legitimately — the citizen holds the code, and the agent must obtain it in person to mark a job done and earn their payment.

---

## ✨ Features

### For Citizens
- Schedule waste pickups with date, time slot, waste type, and address
- View pickup history with real-time status updates (Scheduled → Confirmed → In Progress → Completed)
- Receive a unique verification code per pickup to share with the agent on arrival
- Cancel upcoming pickups
- Rate and provide feedback on completed pickups
- Earn points and unlock badges for responsible waste disposal
- View community leaderboard and personal rewards

### For Pickup Agents
- View all assigned pickups in a dedicated dashboard
- Navigate to pickup locations via Google Maps integration
- Call customers directly from the app
- Start pickups (moves status to In Progress)
- Complete pickups by entering the customer's verification code, uploading a photo, and logging actual weight
- Track daily/weekly earnings and performance stats
- 
### General
- JWT-based authentication with 30-day sessions
- Forgot password / reset password via email
- Real-time notification center
- Feedback and complaint submission system
- Waste classification guide
- Responsive UI for desktop and mobile

---

## 👥 User Roles

| Role | Description |
|------|-------------|
| `citizen` | Residential users who schedule waste pickups |
| `pickup_agent` | Field workers who collect waste and complete pickups |

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime environment |
| Express.js v5 | Web framework |
| MongoDB | Database |
| Mongoose | ODM for MongoDB |
| JSON Web Token (JWT) | Authentication |
| bcryptjs | Password hashing |
| Nodemailer | Email sending (password reset) |
| dotenv | Environment variable management |
| nodemon | Development auto-restart |

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| React Router DOM v7 | Client-side routing |
| Axios | HTTP client |
| Lucide React | Icon library |
| Leaflet + React Leaflet | Interactive maps |
| CSS Modules | Component styling |

---

## 📁 Project Structure

```
wastewise/
├── backend/
│   ├── server.js               # Express app entry point
│   ├── config/
│   │   └── database.js         # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── pickupController.js
│   │   ├── wasteController.js
│   │   └── wasteTrackingController.js
│   ├── middleware/
│   │   └── auth.middleware.js   # JWT protect middleware
│   ├── models/
│   │   ├── User.js
│   │   ├── Pickup.js            # Includes verification code generation
│   │   ├── Waste.js
│   │   ├── WasteTracking.js     # Industry manifest tracking
│   │   ├── Feedback.js
│   │   └── Notification.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── pickup.routes.js     # Core pickup flow
│   │   ├── user.routes.js
│   │   ├── waste.routes.js
│   │   ├── wasteTracking.routes.js
│   │   ├── rewards.routes.js
│   │   ├── feedback.routes.js
│   │   └── notification.routes.js
│   └── utils/
│       ├── notificationHelper.js
│       └── sendEmail.js
│
└── frontend/
    └── src/
        ├── App.js
        ├── context/
        │   └── AuthContext.js
        ├── services/
        │   └── api.js
        ├── pages/
        │   ├── Login.js
        │   ├── Register.js
        │   ├── CitizenDashboard.js
        │   ├── PickupAgentDashboard.js
        │   ├── ForgotPassword.js
        │   └── ResetPassword.js
        └── components/
            ├── SchedulePickup.js
            ├── MyPickups.js
            ├── AssignedPickups.js
            ├── CompletePickup.js
            ├── EarningsTracker.js
            ├── PerformanceDashboard.js
            ├── RewardsSystem.js
            ├── NotificationCenter.js
            ├── FeedbackSystem.js
            ├── WasteGuide.js
            ├── MyRoutes.js
            └── ProfileSettings.js
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/wastewise.git
cd wastewise
```

### 2. Setup Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory (see [Environment Variables](#environment-variables) below), then:

```bash
# Development (with auto-restart)
npm run dev

# Production
npm start
```

Backend runs on: `http://localhost:5000`

### 3. Setup Frontend

```bash
cd frontend
npm install
npm start
```

Frontend runs on: `http://localhost:3000`

---

## 🔐 Environment Variables

Create a `.env` file inside the `backend/` folder:

```env
# MongoDB connection string
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/wastewise

# JWT secret key (use a long random string)
JWT_SECRET=your_super_secret_jwt_key_here

# Server port (optional, defaults to 5000)
PORT=5000

# Email config for password reset (e.g. Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive JWT |
| POST | `/api/auth/forgot-password` | Send password reset email |
| POST | `/api/auth/reset-password/:token` | Reset password with token |

### Pickup
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/pickup/schedule` | Citizen | Schedule a new pickup |
| GET | `/api/pickup/my-pickups` | Citizen + Agent | Get pickups (role-based) |
| GET | `/api/pickup/:id` | Citizen + Agent | Get single pickup detail |
| PUT | `/api/pickup/:id/start` | Agent | Mark pickup as In Progress |
| PUT | `/api/pickup/:id/complete` | Agent | Complete pickup with verification code |
| PUT | `/api/pickup/:id/cancel` | Citizen | Cancel a scheduled pickup |
| PUT | `/api/pickup/:id/rate` | Citizen | Rate a completed pickup |

### User
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/profile` | Get current user's profile |
| PUT | `/api/user/profile` | Update profile |

### Rewards
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rewards/leaderboard` | Community leaderboard |
| GET | `/api/rewards/my-rank` | Current user's rank |
| GET | `/api/rewards/badges` | User's earned badges |

### Waste
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/waste/classify` | Classify waste type |
| GET | `/api/waste/guide` | Get waste disposal guide |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get user notifications |
| PUT | `/api/notifications/:id/read` | Mark notification as read |

### Feedback
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/feedback` | Submit feedback or complaint |
| GET | `/api/feedback` | Get user's feedback history |

---

## 🔄 Pickup Completion Flow

```
Citizen Schedules Pickup
        │
        ▼
System auto-assigns a Pickup Agent
        │
        ▼
Agent sees pickup in "Assigned Pickups" tab
        │
        ▼
Agent clicks "Start" → status: In Progress
        │
        ▼
Agent arrives, asks Citizen for Verification Code
(Citizen sees code in "My Pickups" tab)
        │
        ▼
Agent goes to "Complete Pickup" tab
Enters: Verification Code + Photo + Actual Weight
        │
        ▼
Backend validates code → status: Completed
        │
        ├──► Citizen receives points + notification
        └──► Agent earnings updated
```

> ⚠️ **Security Note:** The verification code is only visible to the citizen. It is never sent to or displayed for the agent, ensuring the agent must physically be at the location to complete the job.

---

## 🎮 Gamification System

Citizens earn points for responsible waste disposal:

| Waste Type | Base Points |
|------------|------------|
| Biodegradable | 10 pts |
| Recyclable | 15 pts |
| E-Waste | 20 pts |
| Hazardous | 25 pts |

Points are also awarded based on actual waste weight logged by the agent.

### Badges
Users unlock badges as they complete milestones (e.g., first pickup, 10 pickups, 25 pickups). The leaderboard ranks all citizens by total points earned.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the ISC License.

---

## 👨‍💻 Author

**Priyanshu Gupta**  
GitHub: [@psgupta712](https://github.com/psgupta712)

---

> Built with 💚 to make waste management smarter, cleaner, and more rewarding.

# PrepIQ v2 — AI Interview Preparation Platform

A complete interview prep platform: AI Mock Interviews, Question Bank, Analytics, Resume Builder, and more.

---

## Quick Start

1. Double-click **`start-backend.bat`** (or `cd backend && npm install && npm run dev`)
2. Double-click **`start-frontend.bat`** (or `cd frontend && node static-server.js --root . --port 8124`)
3. Open **http://127.0.0.1:8124**

---

## Setup

### 1. Create `backend/.env.local`
```
MONGODB_URI=mongodb://localhost:27017/prepiq
JWT_SECRET=any-long-random-string
# Optional — for real AI evaluation in mock interviews:
# ANTHROPIC_API_KEY=sk-ant-...
```

### 2. Seed the Question Bank (first run)
After registering and logging in, make yourself admin in MongoDB:
```js
// in mongosh:
use prepiq
db.users.updateOne({ email: "your@email.com" }, { $set: { isAdmin: true } })
```
Then call:
```
POST http://127.0.0.1:3000/api/questions/seed
Authorization: Bearer <your_token>
```
This seeds 30 questions across all categories.

---

## Pages

| Page | URL |
|------|-----|
| Home | `/index.html` |
| Login / Register | `/auth.html` |
| Forgot Password | `/pages/forgot-password.html` |
| Dashboard | `/pages/dashboard.html` |
| Question Bank | `/pages/questions.html` |
| AI Interview | `/pages/interview.html` |
| Analytics | `/pages/analytics.html` |
| Profile | `/pages/profile.html` |
| Resume Builder | `/pages/resume-builder.html` |
| Achievements | `/pages/achievements.html` |

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET  | `/api/auth/me` | Current user |
| POST | `/api/auth/forgot-password` | Send reset link |
| POST | `/api/auth/reset-password` | Reset with token |

### User
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/PUT | `/api/user/profile` | View/edit profile |
| POST | `/api/user/change-password` | Change password |
| DELETE | `/api/user/delete-account` | Delete account |

### Dashboard & Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Full dashboard data |
| GET | `/api/analytics?period=30` | Analytics (7/30/90 days) |
| GET | `/api/streak` | Streak & calendar data |

### Questions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/questions?category=&difficulty=&search=` | List questions |
| GET/POST | `/api/questions/bookmark` | Get/toggle bookmark |
| POST | `/api/questions/seed` | Seed questions (admin) |

### AI Interview
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/interview` | List interviews |
| POST | `/api/interview` | Start new interview |
| GET | `/api/interview/:id` | Get interview |
| PUT | `/api/interview/:id` | Submit answer |
| PATCH | `/api/interview/:id` | Complete interview |

### Practice
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/practice/aptitude?test=` | Fetch aptitude test |
| POST | `/api/practice/aptitude` | Submit & score |
| GET | `/api/practice/quiz?topic=` | Fetch quiz |
| POST | `/api/practice/quiz` | Submit & score |
| GET | `/api/practice/coding?difficulty=&topic=` | Fetch coding challenge |
| POST | `/api/practice/coding` | Submit code |

### Resume
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST/PUT/DELETE | `/api/resume/builder` | Resume CRUD |
| POST | `/api/resume/analyze` | ATS analyze PDF |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/PUT | `/api/admin/users` | Manage users |

---

## MongoDB Collections

`users` `questions` `bookmarks` `practicehistories` `aiinterviews` `streaks` `achievements` `resumes`

---

## Features Implemented

- ✅ Auth: Login, Register, Forgot/Reset Password, JWT, Logout
- ✅ User Profile: Edit, Skills, College, Target Role, Change Password, Delete Account
- ✅ Dashboard: Stats, Weekly chart, Activity feed, Topic accuracy, Streak calendar
- ✅ Question Bank: 30 seed questions, filter by category/difficulty/search, bookmarks, MCQ modal
- ✅ AI Mock Interview: HR/Technical/Behavioral/Coding, AI scoring (real if ANTHROPIC_API_KEY set), history
- ✅ Practice Lab: Aptitude, Quiz, Coding (from v1, now with auth + stat tracking)
- ✅ Analytics: Daily chart, topic accuracy, strong/weak topics, interview history, sessions table
- ✅ Progress: practiceCount, score, XP, levels, streaks — all persist to MongoDB
- ✅ Streak System: Daily tracking, calendar view, milestones
- ✅ Achievements: 10 badges with XP rewards, locked/earned states
- ✅ Resume Builder: Multi-section form, live preview, 3 templates, PDF export, ATS analyzer
- ✅ Gamification: XP points, levels, badges awarded automatically
- ✅ Admin: User management API

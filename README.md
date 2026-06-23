# ⚡ PrepIQ

**AI-powered interview preparation platform** — practice mock interviews, solve curated questions, build an ATS-optimized resume, and track your progress, all in one place.

🔗 **Live App:** [prepiq-frontend.vercel.app](https://prepiq-web.vercel.app)

---

## ✨ Features

### For Candidates
- 🤖 **AI Mock Interviews** — HR, Technical, Behavioral, and Coding interviews evaluated by Gemini AI
- 📚 **Question Bank** — 30+ curated questions across DSA, System Design, SQL, Behavioral, and more, with bookmarking
- 📊 **Analytics Dashboard** — track sessions, scores, topic accuracy, and strengths/weaknesses over time
- 📄 **Resume Builder** — build a resume with multiple templates, get an instant ATS score, and export to PDF
- 🏆 **Achievements & Badges** — earn XP and badges for milestones, with email notifications
- 🔥 **Streaks** — daily practice streak tracking with milestone celebrations
- 🏅 **Leaderboard** — see how you rank against other learners
- 📥 **Downloadable Progress Reports** — export a professional PDF summary of your performance
- 🔗 **Social Sharing** — share earned badges to X, LinkedIn, or WhatsApp

### For Admins
- 📈 **Platform Analytics** — total users, interviews, signups over time, average scores
- 👥 **User Management** — search, view activity, promote to admin, deactivate, or delete accounts
- ❓ **Question Bank Management** — add, edit, or remove questions
- 🎙️ **Interview Oversight** — view all AI interviews completed across the platform
- 📑 **Resume Oversight** — view all resumes built by users

### Authentication
- Email/password signup with secure password hashing
- **Google OAuth** and **GitHub OAuth** one-click login
- Forgot/reset password flow with real email delivery (Gmail SMTP)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Vanilla HTML, CSS, JavaScript (no framework) |
| **Backend** | Next.js (API routes only) |
| **Database** | MongoDB (via Mongoose), hosted on MongoDB Atlas |
| **AI** | Google Gemini API |
| **Email** | Nodemailer + Gmail SMTP |
| **Auth** | JWT, bcrypt, OAuth 2.0 (Google & GitHub) |
| **PDF Export** | jsPDF |
| **Hosting** | Vercel (frontend + backend deployed separately) |

---

## 📁 Project Structure

```
prepiq/
├── backend/                  # Next.js API server
│   ├── lib/
│   │   ├── models/            # Mongoose schemas (User, Question, AIInterview, etc.)
│   │   ├── auth-middleware.js # JWT auth guards, CORS
│   │   ├── email-helper.js    # Gmail SMTP email sending
│   │   ├── xp-system.js       # XP rewards & badge logic
│   │   └── streak-helper.js   # Daily streak calculation
│   └── pages/api/             # REST API routes
│       ├── auth/               # login, register, OAuth, password reset
│       ├── admin/               # admin-only endpoints
│       ├── interview/           # AI interview flow
│       ├── questions/           # question bank + bookmarks
│       ├── resume/              # resume builder + ATS analysis
│       ├── analytics/           # personal analytics
│       └── leaderboard/
│
└── frontend/                  # Static HTML/CSS/JS client
    ├── index.html              # Landing page
    ├── auth.html                # Login/Register
    └── pages/
        ├── dashboard.html        # Personal + admin dashboard
        ├── questions.html        # Question bank
        ├── interview.html        # AI mock interview
        ├── analytics.html        # Progress analytics
        ├── resume-builder.html   # Resume builder + ATS
        ├── achievements.html     # Badges
        └── leaderboard.html
```

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js v18+
- A MongoDB database (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free tier)

### 1. Clone the repo
```bash
git clone https://github.com/YeshaBhagat/prepiq.git
cd prepiq
```

### 2. Install backend dependencies
```bash
cd backend
npm install
```

### 3. Configure environment variables
Create `backend/.env.local`:
```env
MONGODB_URI=mongodb://localhost:27017/prepiq
JWT_SECRET=your_long_random_secret

# AI interview evaluation
GEMINI_API_KEY=your_gemini_api_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Email (Gmail SMTP - use an App Password, not your real password)
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_16_char_app_password

OAUTH_REDIRECT_BASE=http://127.0.0.1:8124
```

### 4. Run the backend
```bash
npx next dev
# Runs on http://localhost:3000
```

### 5. Run the frontend
Open `frontend/index.html` with a local server (e.g. VS Code Live Server) — runs on `http://127.0.0.1:5500` or similar.

### 6. Seed the question bank (one-time)
Make your account an admin directly in MongoDB:
```js
db.users.updateOne({ email: "your@email.com" }, { $set: { isAdmin: true } })
```
Then log in, grab your token from `localStorage.getItem('prepiq_token')`, and run:
```bash
curl -X POST http://localhost:3000/api/questions/seed \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ☁️ Deployment

PrepIQ is deployed as **two separate Vercel projects**:

1. **Backend** (`backend/` as root directory, Next.js preset) — handles all `/api/*` routes
2. **Frontend** (`frontend/` as root directory, static/Other preset) — serves the HTML/CSS/JS client

Set the same environment variables from `.env.local` in the backend's Vercel project settings, and update `OAUTH_REDIRECT_BASE` to your deployed frontend URL. Remember to also update the **Authorized redirect URIs** in your Google Cloud Console and GitHub OAuth App settings to point to your production URLs.

---

## 📜 License

This project is for personal/educational use.

---

Built with ❤️ by Yesha Bhagat

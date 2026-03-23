# Studi App

A gamified study-session tracker that builds academic community. Students log study sessions (subject, location, duration), earn points, maintain streaks, and compete on leaderboards.

## Tech Stack

**Frontend** (`frontend/`)
- React 19 + Vite 7, plain JSX (no TypeScript)
- Vanilla CSS (no Tailwind)
- ESLint 9 with react-hooks and react-refresh plugins

**Backend** (`backend/`)
- Node.js + Express 5
- MongoDB + Mongoose 9
- JWT authentication (access tokens via Bearer header)
- bcryptjs for password hashing
- Helmet, CORS, express-rate-limit, express-validator

## Key Directories

```
studi-app/
├── frontend/
│   ├── src/
│   │   ├── Pages/          # Page-level components (LoginPage, HomeScreen)
│   │   ├── assets/         # Static assets (studiLogo.jpg)
│   │   ├── App.jsx         # Root component
│   │   └── main.jsx        # React entry point
│   └── package.json
├── backend/
│   ├── scripts/            # seed.js — dummy data loader
│   ├── tests/              # Jest + supertest test suites
│   └── src/
│       ├── config/db.js    # MongoDB connection
│       ├── controllers/    # HTTP-layer handlers (authController)
│       ├── middleware/     # auth, errorHandler, rateLimiter
│       ├── models/         # Mongoose schemas (User, Session, Friendship)
│       ├── routes/         # Express route files
│       ├── services/       # Business logic (authService)
│       ├── utils/          # AppError custom error class
│       ├── app.js          # Express app setup + route mounting
│       └── server.js       # Entry point (dotenv, DB connect, listen)
└── README.md
```

## Build & Test Commands

### Frontend
```bash
cd frontend
npm run dev       # Vite dev server with HMR
npm run build     # Production build
npm run lint      # ESLint
npm run preview   # Preview production build
```

### Backend
```bash
cd backend
npm run dev       # Nodemon auto-reload (src/server.js)
npm start         # Node (production)
npm test          # Jest with --forceExit --detectOpenHandles
npm run seed      # Populate DB with dummy users (1 admin + 9 students)
```

## Environment Variables (backend)

Copy `backend/.env.example` to `backend/.env` and fill in values.

| Variable | Purpose |
|---|---|
| `PORT` | Server port (default: 5000) |
| `NODE_ENV` | `development` or `production` (affects error stack traces) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_ACCESS_SECRET` | Access token signing secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | Refresh token signing secret (different from access, min 32 chars) |

## Current State

Sprint 1 auth is complete: register, login, token refresh, and logout endpoints are fully implemented with JWT access + refresh tokens, bcrypt hashing, input validation, and rate limiting. User roles: `student` (default) and `admin`. Frontend has a Login page UI shell; API integration is pending.

## Additional Documentation

| File | When to check |
|---|---|
| `.claude/docs/architectural_patterns.md` | API design, auth flow, data models, gamification structure, middleware chain |

# Architectural Patterns

## API Response Envelope

All endpoints return a consistent JSON structure. See `backend/src/app.js:23-25` (health check) and route files for examples.

```
{ success: boolean, data?: any, error?: { code: string, message: string } }
```

Error responses are handled centrally in `backend/src/middleware/errorHandler.js:2-16` — throw from route handlers, don't send responses inline.

---

## Middleware Chain (backend/src/app.js:17-35)

Request flows through in this order:
1. **Helmet** — security headers
2. **CORS** — cross-origin policy
3. **Morgan** — request logging
4. **JSON body parser**
5. **Route handlers** (`/api/*`)
6. **Global error handler** (last middleware, catches everything)

---

## Authentication Pattern

- JWT Bearer token extracted in `backend/src/middleware/auth.js:14`
- Secret read from `process.env.JWT_ACCESS_SECRET`
- Verified token payload attached to `req.user`
- Apply `auth` middleware to any route requiring authentication
- Auth routes are rate-limited: 10 requests / 15 min / IP (`backend/src/middleware/rateLimiter.js:4-13`)
- Password stored as `passwordHash` (bcryptjs); refresh token stored as `refreshTokenHash`

---

## Data Model Conventions (backend/src/models/)

**Shared conventions across all models:**
- Mongoose schemas with `{ timestamps: true }` — all documents get `createdAt` / `updatedAt`
- Indexes declared at schema level (not in migration files)
- Enum fields use lowercase string arrays

**User** (`User.js:4-72`)
- Gamification state lives on User: `totalPoints`, `currentStreak`, `longestStreak`, `lastStudyDate`
- Indexes on `totalPoints` and `currentStreak` to support leaderboard queries without full scans

**Session** (`Session.js:4-63`)
- `status` enum: `active | paused | completed`
- Pause time tracked via `pausedDuration` (accumulated ms) to keep `durationMinutes` accurate
- `pointsEarned` computed at session end
- Compound indexes: `{ userId, startTime }`, `{ userId, status }`, `{ endTime }` — write queries to use these

**Friendship** (`Friendship.js:4-29`)
- `status` enum: `pending | accepted | declined`
- Unique compound index on `{ requester, recipient }` — prevents duplicate requests; always query with smaller ObjectId as requester to maintain direction consistency

---

## Route Organization (backend/src/routes/)

Each domain has its own route file mounted in `app.js:28-32`:

| Mount point | File | Domain |
|---|---|---|
| `/api/auth` | `authRoutes.js` | Register, login, token refresh, logout |
| `/api/users` | `userRoutes.js` | Profile view/edit, user search |
| `/api/sessions` | `sessionRoutes.js` | Session lifecycle (start/pause/resume/end/history) |
| `/api/friends` | `friendRoutes.js` | Friend requests, list, accept/decline, activity |
| `/api/leaderboard` | `leaderboardRoutes.js` | Global, friends-only, personal rank |

Controllers (`backend/src/controllers/`) and Services (`backend/src/services/`) directories exist but are empty — route logic is not yet extracted there.

---

## Frontend Component Pattern

- Pages live in `frontend/src/Pages/` as `<Name>Page.jsx` with a co-located `<Name>Page.css`
- Local state only (React `useState`); no global state or context yet
- `App.jsx` is the composition root — currently renders `<LoginPage />` directly, pending Router setup

---

## Gamification Data Flow (planned)

Study session lifecycle: `start → (pause → resume)* → end`

On `end`:
1. Calculate `durationMinutes` = (`endTime - startTime - pausedDuration`) / 60000
2. Compute `pointsEarned` (formula TBD)
3. Increment `User.totalPoints`
4. Update `User.currentStreak` and `User.lastStudyDate`
5. Check if `currentStreak > longestStreak` and update

All leaderboard reads use MongoDB index scans on `User.totalPoints` or `User.currentStreak`.

# Backend — Student Performance Intelligence Portal

Node.js + Express REST API with JWT authentication, Socket.io real-time notifications, and MongoDB Atlas.

> For full architecture, ER diagram, and collection design see the [root README](../README.md).

---

## Quick Start

```bash
cp .env.example .env
# Edit .env — set MONGODB_URI and JWT secrets

npm install
npm run seed      # Seed demo accounts
npm run dev       # http://localhost:5000
```

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/student_portal` |
| `JWT_ACCESS_SECRET` | Access token signing secret | Random secure string |
| `JWT_REFRESH_SECRET` | Refresh token signing secret | Random secure string |
| `JWT_ACCESS_EXPIRES` | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRES` | Refresh token TTL | `7d` |
| `CLIENT_URL` | Frontend URL for CORS & Socket.io | `http://localhost:5173` |

---

## Demo Login Credentials

Seed the database first:

```bash
npm run seed
```

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@portal.com` | `password123` |
| Mentor | `mentor@portal.com` | `password123` |
| Evaluator | `evaluator@portal.com` | `password123` |
| Student | `student@portal.com` | `password123` |

---

## How to Login (Backend API)

### 1. Login

```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@portal.com",
  "password": "password123"
}
```

### 2. Use Access Token

Add to all protected requests:

```
Authorization: Bearer <accessToken>
```

### 3. Refresh Token (when access token expires)

```bash
POST http://localhost:5000/api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "<refreshToken>"
}
```

### 4. Logout

```bash
POST http://localhost:5000/api/auth/logout
Authorization: Bearer <accessToken>
```

---

## MongoDB Collections

| Collection | Model File | Purpose |
|------------|------------|---------|
| `users` | `models/User.js` | All user accounts (4 roles) |
| `studentprofiles` | `models/StudentProfile.js` | Student performance profiles |
| `tasks` | `models/Task.js` | Mentor-assigned tasks |
| `submissions` | `models/Submission.js` | Student task submissions |
| `evaluations` | `models/Evaluation.js` | Evaluator feedback & scores |
| `studyplans` | `models/StudyPlan.js` | AI-generated weekly plans |
| `notifications` | `models/Notification.js` | Persistent notifications |

See [root README — Collection Structure](../README.md#mongodb-collection-structure) for full field definitions.

---

## Project Structure

```
src/
├── server.js              # Express + Socket.io entry point
├── seed.js                # Demo data seeder
├── models/                # Mongoose schemas (7 collections)
├── routes/
│   ├── auth.js            # Login, refresh, logout
│   ├── students.js        # Student CRUD & profiles
│   ├── mentors.js         # Mentor management
│   ├── evaluators.js      # Evaluator management
│   ├── tasks.js           # Task assignment & submission
│   ├── evaluations.js     # Evaluation workflow
│   ├── admin.js           # Dashboard analytics
│   ├── ai.js              # AI study coach
│   ├── readiness.js       # Public UPSC analyzer
│   └── notifications.js   # Notification CRUD
├── middleware/
│   └── auth.js            # JWT verify + role authorize()
├── services/
│   ├── notificationService.js
│   └── aiService.js
└── utils/
    ├── tokens.js
    └── helpers.js
```

---

## NPM Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `npm run dev` | `nodemon src/server.js` | Development server with hot reload |
| `npm start` | `node src/server.js` | Production server |
| `npm run seed` | `node src/seed.js` | Create demo users & student profile |

---

## Role Middleware

Routes use `authenticate` + `authorize(...roles)`:

```javascript
router.post('/tasks', authenticate, authorize('mentor'), handler);
```

| Role | Restrictions |
|------|-------------|
| Admin | Full access |
| Mentor | Cannot manage users (`/auth/register`, user CRUD) |
| Evaluator | Cannot assign tasks |
| Student | Own data only |

---

## Socket.io

Server listens on the same port as Express. Clients join a room by user ID:

```javascript
socket.emit('join', userId);
socket.on('notification', (data) => { ... });
```

Events pushed: `task_assigned`, `submission_received`, `evaluation_submitted`, `deadline_approaching`.

---

## Health Check

```bash
GET http://localhost:5000/api/health
# → { "status": "ok" }
```

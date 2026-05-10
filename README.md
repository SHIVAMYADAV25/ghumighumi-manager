# WanderSync — Collaborative Trip Planning Platform

> **Cohort 26 Buildathon — Problem Statement 3**
> A production-ready, real-time collaborative trip planning system built with MERN stack.

---

## 🌍 Live Demo

| Resource | Link |
|---|---|
| **Frontend** | `https://wandersync.vercel.app` |
| **Backend API** | `https://wandersync-api.onrender.com` |
| **API Health** | `https://wandersync-api.onrender.com/health` |

**Demo credentials** (after running seed):
```
Email: alice@wandersync.dev
Password: Password123!
```

---

## 📐 Architecture Overview

```
wandersync/
├── backend/          # Node.js + Express REST API
│   └── src/
│       ├── config/       # DB, Cloudinary
│       ├── controllers/  # Business logic
│       ├── middleware/    # Auth, RBAC, error handling
│       ├── models/        # Mongoose schemas
│       ├── routes/        # Express routers
│       ├── socket/        # Socket.IO real-time layer
│       └── utils/         # JWT, email, logger, notifications
└── frontend/         # Vite + React 18
    └── src/
        ├── api/           # Axios API clients per domain
        ├── components/    # Reusable UI + layout components
        ├── hooks/         # Custom React hooks
        ├── pages/         # Route-level page components
        ├── store/         # Zustand global state
        └── utils/         # Formatters, helpers
```

---

## ✅ Features Implemented

### Required Features
| Feature | Status |
|---|---|
| Create trip (title, dates, travelers) | ✅ |
| Day-wise itinerary builder (auto-generated) | ✅ |
| Add activities as cards | ✅ |
| Drag-and-drop reorder activities | ✅ |
| Invite members via email | ✅ |
| Role-based access: Owner / Editor / Viewer | ✅ |
| Comment system per day or activity | ✅ |
| Checklists (packing, to-do, documents) | ✅ |
| File attachments (tickets, PDFs, images) | ✅ |
| Manual reservation entries | ✅ |
| Budget tracking with expense summary | ✅ |

### Extra Features (Beyond Requirements)
| Feature | Description |
|---|---|
| 🔴 Real-time collaboration | Socket.IO — see others editing live, typing indicators, presence |
| 📊 Expense splitting | Equal / exact / percentage splits with balance calculator |
| 🗳️ Activity voting | Upvote/downvote activities democratically |
| 🌦️ Weather integration | Open-Meteo API — free live forecasts per itinerary day |
| 📧 Email invitations | Branded HTML invite emails with role-specific links |
| 🔔 Real-time notifications | In-app + socket push for all events |
| 📋 Activity audit log | Full history of every change with who did it |
| 🔐 JWT refresh token rotation | Secure httpOnly cookie auth with auto-refresh |
| 📷 Cloudinary file storage | Avatar, cover images, attachments — all CDN-backed |
| 🧩 Trip duplication | Clone a trip with its full itinerary structure |
| 🗂️ Trip archiving | Archive old trips without deleting |
| 🔍 User search | Search users by name/email to invite |
| 📱 Budget pie chart | Recharts category breakdown + daily spend timeline |
| 🌐 Emoji reactions | React to comments with emoji |
| 👥 Mention system | @mention collaborators in comments |
| 🗑️ Soft delete comments | [deleted] marker preserves thread structure |
| ⚡ Optimistic updates | TanStack Query cache updates before server response |

---

## 🗄️ Database Schema Design

### Collections

```
Users            → Auth, preferences, avatar
Trips            → Core entity, RBAC embedded, budget summary
Itineraries      → One doc per day, linked to Trip
Activities       → Cards within a day, ordered, voteable
Comments         → Threaded, reactions, soft-delete, polymorphic target
Checklists       → With embedded items, completion tracking
Expenses         → Split logic, linked to paidBy user
Reservations     → Flights, hotels, transport — confirmation details
Attachments      → Cloudinary-backed, categorized, per-trip
Notifications    → Real-time delivery, read/unread state
Invites          → Token-based, auto-expiring (TTL index)
ActivityLogs     → Immutable audit trail per trip
```

### Key Design Decisions

- **RBAC embedded** in Trip document → single query to check permissions
- **Compound indexes** on frequently queried field combos (trip+dayNumber unique, trip+order, trip+paidBy)
- **TTL index** on Invites.expiresAt → MongoDB auto-cleans expired invitations
- **Soft delete** on Comments → preserves thread integrity
- **Virtual fields** for computed values (duration, daysUntilTrip, budgetRemaining, voteScore, completionRate)
- **Cascade delete** in Trip.delete → cleans all child documents atomically

---

## 🔐 Authentication & Security

- **JWT Access Token** (7d) + **Refresh Token** (30d) stored as httpOnly cookies
- **Bcrypt** password hashing (cost factor 12)
- **Helmet** security headers
- **express-mongo-sanitize** NoSQL injection prevention
- **express-rate-limit** — global (100/15min) + auth-specific (20/15min)
- **CORS** locked to frontend origin
- **Token enumeration prevention** on forgot-password route

### RBAC Matrix

| Action | Owner | Editor | Viewer |
|---|---|---|---|
| View trip | ✅ | ✅ | ✅ |
| Edit trip settings | ✅ | ✅ | ❌ |
| Add/edit activities | ✅ | ✅ | ❌ |
| Add expenses | ✅ | ✅ | ❌ |
| Comment | ✅ | ✅ | ✅ |
| Toggle checklist items | ✅ | ✅ | ✅ |
| Upload files | ✅ | ✅ | ❌ |
| Invite collaborators | ✅ | ✅* | ❌ |
| Change roles | ✅ | ❌ | ❌ |
| Remove collaborators | ✅ | ❌ | ❌ |
| Delete trip | ✅ | ❌ | ❌ |

*Only if `settings.allowMemberInvite = true`

---

## 🔌 API Reference

Base URL: `/api/v1`

### Auth
| Method | Route | Description |
|---|---|---|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login, returns JWT + cookie |
| POST | `/auth/logout` | Clear cookies |
| POST | `/auth/refresh` | Refresh access token |
| GET | `/auth/me` | Get current user |
| PATCH | `/auth/me` | Update profile |
| PATCH | `/auth/me/password` | Change password |
| PATCH | `/auth/me/avatar` | Upload avatar |
| GET | `/auth/verify-email/:token` | Verify email |
| POST | `/auth/forgot-password` | Request reset |
| PATCH | `/auth/reset-password/:token` | Reset password |

### Trips
| Method | Route | Access |
|---|---|---|
| GET | `/trips` | Auth |
| POST | `/trips` | Auth |
| GET | `/trips/:id` | Member |
| PUT | `/trips/:id` | Editor+ |
| DELETE | `/trips/:id` | Owner |
| POST | `/trips/:id/cover` | Editor+ |
| GET | `/trips/:id/stats` | Member |
| GET | `/trips/:id/activity-log` | Member |
| POST | `/trips/:id/archive` | Owner |
| POST | `/trips/:id/duplicate` | Member |

### Itinerary
| Method | Route |
|---|---|
| GET | `/trips/:tripId/itineraries` |
| PATCH | `/trips/:tripId/itineraries/:id` |

### Activities
| Method | Route |
|---|---|
| GET | `/trips/:tripId/activities` |
| POST | `/trips/:tripId/activities` |
| PUT | `/trips/:tripId/activities/:id` |
| DELETE | `/trips/:tripId/activities/:id` |
| PATCH | `/trips/:tripId/activities/reorder` |
| POST | `/trips/:tripId/activities/:id/vote` |

### Budget
| Method | Route |
|---|---|
| GET | `/trips/:tripId/budget` |
| PATCH | `/trips/:tripId/budget` |
| POST | `/trips/:tripId/budget/expenses` |
| PATCH | `/trips/:tripId/budget/expenses/:id` |
| DELETE | `/trips/:tripId/budget/expenses/:id` |
| PATCH | `/trips/:tripId/budget/expenses/:id/settle` |

### Collaborators
| Method | Route |
|---|---|
| GET | `/trips/:tripId/collaborators` |
| POST | `/trips/:tripId/collaborators/invite` |
| PATCH | `/trips/:tripId/collaborators/:userId/role` |
| DELETE | `/trips/:tripId/collaborators/:userId` |
| POST | `/trips/:tripId/collaborators/leave` |
| GET | `/trips/:tripId/collaborators/invites` |
| DELETE | `/trips/:tripId/collaborators/invites/:id` |

### Comments
`GET / POST / PATCH / DELETE` on `/trips/:tripId/comments`
`POST /trips/:tripId/comments/:id/react`

### Checklists
Full CRUD on `/trips/:tripId/checklists`
Item management: `POST /:id/items`, `PATCH /:checklistId/items/:itemId/toggle`, `DELETE /:checklistId/items/:itemId`

### Reservations
Full CRUD on `/trips/:tripId/reservations`

### Attachments
`GET / POST / DELETE` on `/trips/:tripId/attachments`

### Invites (public)
| Method | Route |
|---|---|
| GET | `/invites/:token` |
| POST | `/invites/:token/accept` |
| POST | `/invites/:token/decline` |

### Notifications
`GET / PATCH /read / DELETE /clear / DELETE /:id` on `/notifications`

### Weather
`GET /weather/forecast?lat=&lng=&startDate=&endDate=`

---

## ⚡ Real-Time Events (Socket.IO)

### Client → Server
| Event | Payload |
|---|---|
| `trip:join` | `tripId` |
| `trip:leave` | `tripId` |
| `comment:typing` | `{ tripId, targetId }` |
| `comment:stopTyping` | `{ tripId }` |
| `day:viewing` | `{ tripId, dayNumber }` |

### Server → Client
| Event | Payload |
|---|---|
| `notification:new` | Notification object |
| `activity:created` | `{ activity }` |
| `activity:updated` | `{ activity }` |
| `activity:deleted` | `{ activityId }` |
| `activity:reordered` | `{ activities }` |
| `activity:voted` | `{ activityId, votes, voteScore }` |
| `comment:created` | `{ comment }` |
| `comment:updated` | `{ comment }` |
| `comment:deleted` | `{ commentId }` |
| `comment:reacted` | `{ commentId, reactions }` |
| `checklist:itemToggled` | `{ checklistId, itemId, isCompleted }` |
| `expense:added` | `{ expense }` |
| `trip:updated` | `{ trip }` |
| `collaborator:removed` | `{ userId }` |
| `collaborator:roleChanged` | `{ userId, role }` |
| `user:online` | `{ userId, name, avatar }` |
| `user:offline` | `{ userId }` |

---

## 🎨 Frontend Design System

**Color Palette** — warm, earthy, unique (no blue/purple):

| Token | Hex | Usage |
|---|---|---|
| `amber` | `#E8C547` | Primary CTA, accents, active states |
| `ink-800` | `#1C1C16` | Main background |
| `ink-700` | `#26261F` | Card background |
| `sand-100` | `#F5F3EC` | Primary text |
| `sand-500` | `#BFB49A` | Muted text |
| `sage` | `#7A9E7E` | Success, confirmed |
| `terracotta` | `#C4614A` | Danger, cancelled |

**Typography:**
- Display: `Playfair Display` (serif) — headers, trip titles
- Body: `DM Sans` — all UI text
- Mono: `JetBrains Mono` — confirmation numbers, codes

**Animation library:** Framer Motion — page transitions, card hover, modals, stagger lists

---

## 🚀 Setup & Running Locally

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas URI (or local MongoDB)
- Cloudinary account (free tier works)
- SMTP credentials (Gmail App Password recommended)

### Backend Setup

```bash
cd backend
npm install

# Copy and fill in environment variables
cp .env.example .env

# Seed the database with demo data
npm run seed

# Start development server
npm run dev
```

**Required `.env` variables:**
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_32char_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=noreply@wandersync.com
FROM_NAME=WanderSync
CLIENT_URL=http://localhost:5173
```

### Frontend Setup

```bash
cd frontend
npm install

# Copy env
cp .env.example .env

# Start dev server
npm run dev
```

Frontend available at `http://localhost:5173`

---

## 🌐 Deployment

### Backend → Render.com

1. Create new **Web Service** on Render
2. Connect GitHub repo, set root to `backend/`
3. Build command: `npm install`
4. Start command: `npm start`
5. Add all environment variables from `.env.example`
6. Set `NODE_ENV=production`

### Frontend → Vercel

1. Import GitHub repo on Vercel
2. Set root directory to `frontend/`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add env: `VITE_API_URL=https://your-backend.onrender.com`
6. Update backend `CLIENT_URL` to your Vercel domain

### CORS Update
In `backend/.env`:
```env
CLIENT_URL=https://your-app.vercel.app
```

---

## 🧪 Testing the Demo

After running `npm run seed` in the backend:

1. **Login as Alice** — trip owner, full access
2. **Login as Bob** — editor, can add/edit activities and expenses
3. **Login as Carol** — viewer, read-only
4. Open two browser tabs → see real-time sync
5. Send an invite email from People tab
6. Test the itinerary drag-and-drop reordering
7. Add expenses and see the split calculations
8. Upload a file in the Files tab

---

## 📁 Project Structure (Detailed)

```
backend/src/
├── config/
│   ├── database.js        # Mongoose connection with pool config
│   └── cloudinary.js      # Multer-Cloudinary storage configs
├── controllers/
│   ├── auth.controller.js
│   ├── trip.controller.js
│   ├── activity.controller.js
│   ├── itinerary.controller.js
│   ├── collaborator.controller.js
│   ├── invite.controller.js
│   ├── budget.controller.js
│   ├── comment.controller.js
│   ├── checklist.controller.js
│   ├── attachment.controller.js
│   ├── reservation.controller.js
│   ├── notification.controller.js
│   ├── user.controller.js
│   └── weather.controller.js
├── middleware/
│   ├── auth.js            # JWT verification, optional auth
│   ├── tripAccess.js      # RBAC — loadTrip, requireEditor, requireOwner
│   └── errorHandler.js    # Centralized error + AppError class
├── models/
│   ├── User.js            # Auth, preferences, avatar
│   ├── Trip.js            # Core + embedded collaborators
│   ├── Itinerary.js       # Day-level, weather storage
│   ├── Activity.js        # Cards, voting, ordering
│   ├── Comment.js         # Threaded, reactions, soft-delete
│   ├── Checklist.js       # Items with assignment + priority
│   ├── Expense.js         # Splits, currency, linked activity
│   ├── Reservation.js     # Flights, hotels, transport
│   ├── Attachment.js      # Cloudinary file metadata
│   ├── Notification.js    # Real-time + read state
│   ├── Invite.js          # TTL-indexed, token-based
│   └── ActivityLog.js     # Immutable audit trail
├── routes/               # Express routers (all 14 route files)
├── socket/
│   └── socketManager.js   # Socket.IO init, rooms, event handlers
└── utils/
    ├── catchAsync.js      # Async error wrapper
    ├── logger.js          # Colored console logger
    ├── jwt.js             # Sign, verify, cookie management
    ├── email.js           # Nodemailer + HTML templates
    ├── notifications.js   # Create + real-time push
    ├── activityLog.js     # Audit trail creator
    └── seeder.js          # Dev seed script

frontend/src/
├── api/                   # Axios instances per domain
├── components/
│   ├── ui/                # Avatar, Badge, Button, Input, Modal, etc.
│   └── layout/            # Sidebar, AppLayout, TripLayout
├── hooks/                 # useSocket, useTripSocket, useDebounce
├── pages/
│   ├── auth/              # Login, Register, ForgotPassword
│   ├── trip/              # Overview, Itinerary, Budget, Checklists,
│   │                        Reservations, Files, People
│   ├── LandingPage.jsx
│   ├── TripsPage.jsx
│   ├── NewTripPage.jsx
│   ├── NotificationsPage.jsx
│   ├── ProfilePage.jsx
│   ├── ArchivePage.jsx
│   └── InvitePage.jsx
├── store/                 # authStore, socketStore, notificationStore
└── utils/                 # formatDate, formatCurrency, initials, etc.
```

---

## 📊 Evaluation Criteria Coverage

| Criterion | Implementation |
|---|---|
| **Feature completeness** | All required + 15 extra features |
| **Workflow implementation** | Full invite → join → collaborate → expense settle workflow |
| **Database schema design** | 12 collections, virtuals, compound indexes, TTL, cascade delete |
| **Code structure** | MVC pattern, separated concerns, reusable middleware |
| **UI clarity** | Dark earthy design, Framer Motion animations, responsive tabs |
| **Deployment quality** | Render (API) + Vercel (FE), env vars, CORS, production config |
| **Demo readiness** | Seeder script, demo accounts, all flows connected |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js 18+ |
| **Framework** | Express.js 4 |
| **Database** | MongoDB + Mongoose |
| **Auth** | JWT (access + refresh), bcryptjs |
| **Real-time** | Socket.IO 4 |
| **File storage** | Cloudinary + multer-storage-cloudinary |
| **Email** | Nodemailer |
| **Frontend** | React 18 + Vite 5 |
| **Routing** | React Router DOM 6 |
| **State** | Zustand + TanStack Query |
| **UI** | Tailwind CSS 3 + Framer Motion |
| **Charts** | Recharts |
| **DnD** | @dnd-kit |
| **HTTP client** | Axios |

---

## 👤 Author

Built for **Cohort 26 Buildathon** — Web Dev Cohort 2026
Individual submission · Problem Statement 3: Collaborative Trip Planning

---

*WanderSync — Plan Together, Travel Better* ✈️
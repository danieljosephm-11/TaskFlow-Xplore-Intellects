# TaskFlow — Xplore Intellects
### Enterprise MERN Stack Task Management System
**Technical Assessment Submission — MERN Stack Engineering Internship**

---

## 1. Project Overview

**TaskFlow — Xplore Intellects** is a production-style, full-stack enterprise task management platform engineered for scalable team delegation, strict role-based access control (RBAC), and automated real-time email notification workflows.

The application features separate, hardened portals for **Executive Administrators** and **Workforce Employees**, backed by an Express REST API, MongoDB/Mongoose models, JWT cookie & bearer token authentication, bcrypt password hashing, Nodemailer SMTP delivery tracking, and a Tailwind CSS interface designed in adherence to enterprise SaaS standards.

---

## 2. Key Features

- **Role-Based Access Control (RBAC)**:
  - Separate login experiences: `/login/admin` and `/login/employee`.
  - Backend authorization middleware strictly isolates endpoints (Admin cannot be impersonated; Employees can only view and update tasks assigned specifically to their own account).
  - Deactivated employees are immediately blocked from logging in or querying APIs.
- **Task Delegation & Lifecycle Management**:
  - Task creation with title (max 120 chars), description, priority (`HIGH`, `MEDIUM`, `LOW`), lifecycle status (`NOT_STARTED`, `PENDING`, `IN_PROGRESS`, `COMPLETED`), and optional due dates.
  - Reassignment and task metadata updates with audit logging.
  - Interactive status change dialog for employees with optional progress notes.
- **Automated SMTP Email Notifications (Nodemailer)**:
  - **Email 1 — Task Assignment**: Dispatched to employee with task title, identifier, priority, due date, and direct application link.
  - **Email 2 — Task Status Update**: Dispatched to Admin when employee updates status with previous status, new status, and timestamp.
  - Safe error handling: DB changes are preserved if SMTP delivery fails; failed messages are logged in a dedicated `Notification` model with a 1-click retry mechanism in the Notification Center.
- **Real-Time Database Statistics & Analytics**:
  - Live counts calculated from MongoDB: Total Employees, Total Tasks, Not Started, Pending, In Progress, Completed, High Priority, and Overdue.
  - Interactive distribution bars and workforce completion velocity metrics.
- **High-Density Table Operations**:
  - Server-side text search (title, task identifier, or assignee).
  - Multi-criteria filters (Status, Priority, Assigned Employee).
  - Server-side pagination (10, 25, 50 per page) with record counters.
- **Audit Trails**:
  - Every status modification, creation, or reassignment logs a historical record in `TaskActivity` with actor name, timestamp, and notes.

---

## 3. Technology Stack

### Frontend
- **Framework**: React 19 with Vite & TypeScript
- **Styling**: Tailwind CSS v4 (navy, white, and indigo palette; zero gratuitous pill clutter; full responsive layout)
- **Routing**: React Router DOM (v7)
- **HTTP Client**: Axios with Bearer token & cookie interceptors
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js & Express.js
- **Database**: MongoDB Atlas with Mongoose schemas, validators, and indexes
- **Authentication**: JSON Web Tokens (JWT) & bcryptjs (salt rounds: 10)
- **Email Service**: Nodemailer SMTP with HTML templates & isolated retry queues
- **Data Layer**: Dual-mode engine — connects directly to live **MongoDB Atlas** via `MONGODB_URI`, with automatic in-memory persistence fallback for zero-setup local reviews.

---

## 4. Folder Structure

```
taskflow-xplore/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   └── common/
│   │   ├── context/
│   │   ├── layouts/
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   ├── auth/
│   │   │   └── employee/
│   │   ├── services/
│   │   └── types/
│   ├── package.json
│   └── .env.example
├── server/
│   ├── scripts/
│   │   └── seed.ts
│   ├── src/
│   │   ├── config/
│   │   │   └── db.ts
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── Task.ts
│   │   │   ├── TaskActivity.ts
│   │   │   └── Notification.ts
│   │   ├── routes/
│   │   ├── services/
│   │   │   ├── dataService.ts
│   │   │   └── emailService.ts
│   │   ├── types/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── tests/
│   │   └── api.test.ts
│   ├── package.json
│   └── .env.example
├── server.ts             # Unified full-stack entry point for Vite + Express
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .env.example
└── README.md
```

---

## 5. Demo Credentials

The database is pre-seeded with 1 Administrator, 3 Employees, and 14 diverse tasks:

| Role | Name | Email | Password | Department |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Eleanor Vance | `admin@xploreintellects.com` | `Admin@12345` | Engineering Leadership |
| **Employee** | John Doe | `john.doe@xploreintellects.com` | `Employee@12345` | Frontend Engineering |
| **Employee** | Jane Smith | `jane.smith@xploreintellects.com` | `Employee@12345` | Backend Architecture |
| **Employee** | Robert Chen | `robert.chen@xploreintellects.com` | `Employee@12345` | Quality Assurance & DevOps |

> *Quick-Login Feature*: Both `/login/admin` and `/login/employee` include 1-click demo autofill buttons for immediate reviewer testing without manual entry.

---

## 6. Installation & Local Setup

### Prerequisites
- Node.js (v18.0.0 or later)
- npm (v9.0.0 or later)
- MongoDB Atlas cluster URL (optional for live database; system runs out-of-the-box with built-in in-memory fallback if omitted)

### Step 1: Clone Repository
```bash
git clone https://github.com/your-username/taskflow-xplore.git
cd taskflow-xplore
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Populate your environment variables (see Section 7).

### Step 3: Install Dependencies
```bash
npm install
```

### Step 4: Run the Application
Start the unified full-stack server (runs Express API backend on port 3000 mounting Vite frontend middleware):
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 7. Environment Variables Configuration

### `server/.env.example` & Root `.env`:
```env
# Server Port
PORT=3000

# MongoDB Atlas Connection String
# e.g. mongodb+srv://<username>:<password>@cluster0.mongodb.net/taskflow?retryWrites=true&w=majority
MONGODB_URI=

# JWT Secret for Signing Authentication Tokens
JWT_SECRET=xplore-intellects-taskflow-secret-key-2026

# Frontend Application URL (used for links inside email templates)
FRONTEND_URL=http://localhost:3000

# Nodemailer SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_specific_password
EMAIL_FROM=noreply@taskflow.xploreintellects.com
ADMIN_NOTIFICATION_EMAIL=admin@xploreintellects.com
```

### `client/.env.example`:
```env
VITE_API_BASE_URL=/api
```

---

## 8. Database Seeding & Reset

To manually trigger or re-seed the database:
```bash
npm run seed
```
Or use the in-app reset endpoint:
`POST /api/seed/reset`

---

## 9. API Endpoint Documentation

### Authentication
- `POST /api/auth/login` — Public. Validates credentials, issues JWT cookie & token.
- `POST /api/auth/logout` — Public. Clears authentication cookie.
- `GET /api/auth/me` — Protected. Returns current user details.

### Employees (Admin Role Required)
- `GET /api/employees` — List employees with pagination, search, and department filter.
- `GET /api/employees/active` — List active employees (available for assignment dropdowns).
- `POST /api/employees` — Create new employee with duplicate email check and password hashing.
- `GET /api/employees/:id` — Get employee details and assigned tasks.
- `PUT /api/employees/:id` — Update employee profile details.
- `PATCH /api/employees/:id/status` — Toggle employee active/inactive account status.

### Tasks
- `GET /api/tasks` — Protected. Admins query all tasks; Employees receive only tasks assigned to their account. Supports `page`, `limit`, `search`, `status`, `priority`, `employeeId`.
- `POST /api/tasks` — Admin only. Creates task and dispatches assignment email to employee.
- `GET /api/tasks/:id` — Protected. Fetches single task (with RBAC ownership check for employees).
- `PUT /api/tasks/:id` — Admin only. Modifies task metadata or reassigns employee (sends email if reassigned).
- `PATCH /api/tasks/:id/status` — Assigned Employee or Admin. Updates status, writes audit log, and emails Admin.
- `DELETE /api/tasks/:id` — Admin only. Deletes task and related records.
- `GET /api/tasks/:id/activity` — Protected. Returns audit log history for a task.

### Analytics & System
- `GET /api/dashboard/admin` — Admin only. Aggregates live statistics, status distribution, priority ratios, and employee performance.
- `GET /api/dashboard/employee` — Employee only. Aggregates personal statistics, overdue flags, and approaching deadlines.
- `GET /api/notifications` — Admin only. Lists email notification delivery records.
- `POST /api/notifications/:id/retry` — Admin only. Retries delivery for a failed email notification.
- `GET /api/health` — Public. Returns system health, timestamp, and database engine type.

---

## 10. Automated & Manual Testing

### Run Automated API Test Suite
The project contains an automated integration test script testing all 12 assessment criteria:
```bash
npx tsx server/tests/api.test.ts
```
**Tests Covered**:
1. Successful Admin and Employee login
2. Rejection of invalid credentials with 401
3. Admin-only endpoints access
4. Employee blocked from Admin endpoints with 403
5. Admin task creation and validation
6. Rejection of task assignment to invalid employee
7. Assigned employee status update with audit logging
8. Prevention of employee modifying another employee's task
9. Server-side search and pagination
10. Input validation and error handling
11. Duplicate employee email conflict rejection (409)
12. Notification delivery tracking and retry

### Manual Verification Workflow
1. **Admin Journey**:
   - Navigate to `/login/admin` and click **"Auto-Fill Demo Admin"**.
   - Review overview cards, status distribution, and velocity on `/admin/dashboard`.
   - Go to **Employees** (`/admin/employees`). Add an employee or toggle account activation.
   - Go to **Create Task** (`/admin/tasks/create`). Select an active employee, set priority to `HIGH`, and save.
   - Go to **All Tasks** (`/admin/tasks`). Test live debounced search and pagination controls.
   - Click the **Bell Icon** in the top navigation bar to open the **Email Notification Log** and review queued/sent dispatches.
2. **Employee Journey**:
   - Sign out and navigate to `/login/employee`.
   - Click **"John Doe"** to autofill credentials and sign in.
   - Notice the personal metrics on `/employee/dashboard`, including tasks approaching due date.
   - Go to **My Tasks** (`/employee/tasks`).
   - Click **"Update Status"** on a task, select `COMPLETED`, enter progress notes, and submit.
   - Observe immediate status badge update and audit log recording.
   - Try navigating manually to `/admin/dashboard` to verify that the RBAC guard redirects to `/unauthorized`.

---

## 11. Deployment Guidelines

### Backend Deployment (Render or Railway)
1. Link your repository.
2. Set build command: `npm install`
3. Set start command: `npx tsx server/src/server.ts`
4. Configure environment variables in dashboard: `MONGODB_URI`, `JWT_SECRET`, `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`.

### Frontend Deployment (Firebase App Hosting or Vercel)
1. Configure build command: `npm run build`
2. Output directory: `dist`
3. Environment variables: `VITE_API_BASE_URL=https://your-backend.onrender.com/api`

---

## 12. Assessment Compliance Checklist

- [x] Full-Stack MERN Architecture (React, Node, Express, MongoDB/Mongoose)
- [x] Role-Based Access Control enforced on backend & frontend
- [x] Admin & Employee Login with password visibility and demo presets
- [x] Server-side debounced search and pagination
- [x] Email notifications for task assignments and status updates
- [x] Notification delivery audit logging and retry endpoint
- [x] Task Activity audit history tracking
- [x] Form validation with clear error messages
- [x] Navy & Indigo SaaS aesthetic with zero-pill discipline
- [x] Clean seed data and comprehensive API test suite

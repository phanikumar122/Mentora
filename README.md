# Mentora — Centralized Academic & Real-Time Educational Platform

Mentora is a production-grade, secure, modern educational web platform connecting **Students**, **Teachers**, and **Administrators** in a unified portal for academic management, assignment submissions, attendance tracking, study resource sharing, discussion forums, and real-time STOMP WebSocket messaging.

---

## Key Features

- ** Role-Based Access Control (RBAC)**: Distinct permissions and interactive portals for `STUDENT`, `TEACHER`, and `ADMIN`.
- ** Real-Time Messaging**: STOMP over WebSockets for 1-on-1 teacher-student chat and class discussion rooms.
- ** Academic Management**: Department, course, subject, and weekly timetable management.
- ** Assignments & Grading**: Assignment creation, deadline tracking, solution file upload, grading, and teacher feedback.
- ** Attendance & Analytics**: Class attendance marking, student percentage tracking, and CGPA metrics.
- ** Interactive Discussion Forum**: Q&A community forum with category filters, upvotes, and answer thread replies.
- ** Notice Board**: Priority-coded system and department announcement broadcasts.
- ** Study Material Hub**: Categorized resource repository for slides, reference manuals, and code samples.
- ** Modern UI/UX**: Dark/Light mode theme engine, glassmorphic layout cards, responsive mobile sidebar, and smooth micro-interactions.

---

## Project Architecture

Mentora is structured as a full-stack project containing two main subdirectories:

```text
Mentora/
├── PROMPT.md               # Master AI Prompt Specification
├── README.md               # Project Documentation & Run Guide
├── mentora-backend/        # Java 21 Spring Boot 3.x REST & WebSocket Service
│   ├── src/main/java/com/mentora/
│   │   ├── config/         # Security, CORS, WebSockets, Data Seed Initializer
│   │   ├── controller/     # Auth, User, Academic, Assignment, Chat Controllers
│   │   ├── dto/            # Data Transfer Objects
│   │   ├── entity/         # 18 JPA Entities & Domain Enums
│   │   ├── repository/     # Spring Data JPA Interfaces
│   │   └── security/       # JWT Tokens & Custom UserDetailsService
│   └── pom.xml             # Maven Project Dependencies
└── mentora-frontend/       # React 18 + TypeScript + Vite + Tailwind CSS Web Client
    ├── src/
    │   ├── components/     # Navbar, Sidebar, DashboardLayout
    │   ├── context/        # AuthContext, ThemeContext
    │   ├── pages/          # Student, Teacher, Admin, Chat, Forum, Materials
    │   └── services/       # Axios API client with JWT Header Interceptor
    └── package.json
```

---

## Local Administrator Account

The default local-development profile uses an in-memory H2 database and creates an initial administrator only when the account does not already exist:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@mentora.com` | `admin@mentora` |

*Production does not bootstrap an administrator unless `MENTORA_BOOTSTRAP_ADMIN_ENABLED=true` is explicitly configured. Never use the local password in production.*

---

## Getting Started

### 1. Backend Setup (`mentora-backend`)

#### Prerequisites
- Java 21+ JDK

#### Run locally:
```bash
cd mentora-backend
mvn spring-boot:run
```
The REST API server will start on `http://localhost:8081`.
- **Health**: `http://localhost:8081/api/v1/health`
- **H2 In-Memory DB Console**: `http://localhost:8081/h2-console` (JDBC URL: `jdbc:h2:mem:mentoradb`, Username: `sa`, Password: empty)
- **Swagger / OpenAPI Documentation**: `http://localhost:8081/swagger-ui.html`

Run backend verification with:
```bash
./mvnw test
```

---

### 2. Frontend Setup (`mentora-frontend`)

#### Prerequisites
- Node.js v18+ and npm

#### Run locally:
```bash
cd mentora-frontend
npm install
npm run dev
```
The React development server will launch on `http://localhost:3000`.

Run the production build check with:
```bash
npm run build
npm run lint
```

---

## Deployment Guide

- **Configuration**: Copy `.env.example` to `.env` and replace every placeholder with a real secret.
- **Database**: The `prod` Spring profile expects a MySQL-compatible database through `MENTORA_DB_URL`, `MENTORA_DB_USER`, and `MENTORA_DB_PASS`.
- **Public URLs**: Set `MENTORA_CORS_ORIGINS` to the exact HTTPS frontend origin and `VITE_API_URL` to the public HTTPS backend URL ending in `/api/v1`.
- **Safety**: Keep `MENTORA_BOOTSTRAP_ADMIN_ENABLED=false`; the retained administrator already exists in TiDB. Do not commit `.env`.
- **Backend Service**: Render / Railway (Deploy `mentora-backend` using Docker or Java runtime).
- **Frontend App**: Vercel / Netlify (Deploy `mentora-frontend` with build command `npm run build`).

### Production checklist

1. Change the retained demo administrator password before exposing the application publicly.
2. Use a new random `MENTORA_JWT_SECRET` of at least 32 characters and keep it stable across restarts.
3. Set `SPRING_PROFILES_ACTIVE=prod` on the backend.
4. Set `MENTORA_CORS_ORIGINS` to the exact frontend HTTPS origin, without a trailing slash.
5. Build the frontend with `VITE_API_URL=https://your-backend.example/api/v1`.
6. Attach persistent storage to `/app/uploads` when using assignment file submissions.
7. Verify `/api/v1/health`, sign-in, account creation, and chat after deployment.

The one-time database reset has already been completed. No destructive reset runner is shipped with
the production application. Production configuration must provide explicit `MENTORA_CORS_ORIGINS`
and `VITE_API_URL` values using the public HTTPS frontend and backend domains.

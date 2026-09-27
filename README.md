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

## Administrator Account Credentials

The backend automatically initializes the primary Administrator account on startup:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@mentora.com` | `admin@mentora` |

*Note: All student, faculty, and department setup is managed through the Administrator portal.*

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
The REST API server will start on `http://localhost:8080`.
- **H2 In-Memory DB Console**: `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:mem:mentoradb`, Username: `sa`, Password: empty)
- **Swagger / OpenAPI Documentation**: `http://localhost:8080/swagger-ui.html`

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

---

## Deployment Guide

- **Database**: Neon PostgreSQL (Set `spring.datasource.url` in `application.yml` for production).
- **Backend Service**: Render / Railway (Deploy `mentora-backend` using Docker or Java runtime).
- **Frontend App**: Vercel / Netlify (Deploy `mentora-frontend` with build command `npm run build`).

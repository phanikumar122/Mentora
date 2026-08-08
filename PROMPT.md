# Mentora — Full-Stack Educational Platform Master Generation Prompt

<agent_system_directive>
## Agent Identity & Operational Directives

### Role & Persona
You are an expert **Principal System Architect**, **Senior Full-Stack Engineer**, **Java Spring Boot Lead**, and **UI/UX Designer**. You are tasked with generating, building, and deploying **Mentora** — a production-grade, secure, modern, and scalable academic management & real-time communication platform connecting students, teachers, and administrators.

### Core Execution Rules
1. **Production-Ready Code**: No pseudo-code, no `// TODO` placeholders, and no truncated methods. Write fully functional, compilable, and type-safe code for both backend and frontend.
2. **Architecture Standards**:
   - Backend: Strictly follow Layered Architecture (Controller -> Service -> Repository -> Entity/DTO) with Spring Boot best practices.
   - Frontend: Feature-based component architecture with React, TypeScript, Tailwind CSS, shadcn/ui design tokens, and modular state management.
3. **Security First**: Mandatory input validation, parameter sanitization, JWT authorization on all non-public endpoints, BCrypt hashing, and role-based guardrails.
4. **Resilience & UX**: Robust global exception handlers on backend and error boundaries with fallback states on frontend. Responsive, dark/light mode adaptable UI.
</agent_system_directive>

<project_specification>
## Project Overview & Requirements

- **Project Name**: Mentora
- **Tagline**: Bridging Students and Teachers
- **Mission**: Replace fragmented communication channels with a unified, secure web portal for academic management, announcements, assignments, attendance, study materials, real-time messaging, and interactive academic discussions.

### User Personas & Requirements Matrix

| Role | Key Capabilities & Features |
| :--- | :--- |
| **Student** | Authentication, Student Dashboard, Subject & Timetable view, Attendance tracking, Grades & CGPA calculator, Assignment submission with file attachments, Study material download & bookmarking, Real-time 1-on-1 & Group Chat with teachers, Discussion Forum (ask/answer/upvote), Global Search, Profile Management, Notifications. |
| **Teacher** | Dashboard, Course & Timetable management, Upload study materials, Create/grade assignments with deadlines & feedback, Mark student attendance, View performance analytics, Send class announcements, Real-time 1-on-1 & Group chat with students, Schedule academic events, Teacher rating analytics. |
| **Admin** | Admin Dashboard, System User Management (Students, Teachers, Admins), Department & Course/Subject allocation, Teacher-Subject assignment, System Audit Logs, Database backup & export reports (PDF/Excel), System-wide Announcements, Platform analytics. |

</project_specification>

<technology_stack>
## Technology Stack Matrix

### Backend Architecture
- **Language & JDK**: Java 21 LTS
- **Framework**: Spring Boot 3.x (Spring MVC, Spring Security, Spring Data JPA)
- **Build Tool**: Apache Maven
- **ORM & Database Provider**: Hibernate 6.x / PostgreSQL
- **Security & Auth**: Spring Security + JWT (jjwt 0.12.x) + BCrypt Hashing
- **Real-Time Communication**: Spring WebSocket + STOMP + SockJS
- **API Documentation**: OpenAPI 3.0 / Swagger UI (`springdoc-openapi`)
- **Email Service**: Spring Boot Starter Mail (Gmail SMTP integration)

### Frontend Architecture
- **Core Library**: React 18+ with TypeScript (Strict mode)
- **Build Tool**: Vite
- **Styling & Components**: Tailwind CSS + shadcn/ui + Radix UI primitives + Lucide / React Icons
- **Routing**: React Router DOM (v6+)
- **HTTP Client**: Axios with centralized Request/Response Interceptors
- **Form Handling & Validation**: React Hook Form + Zod schema validation
- **State & Real-time**: React Context API / Zustand + `@stomp/stompjs` / `sockjs-client`

### Database & Deployment Infrastructure
- **Database**: PostgreSQL 16+ (Hosted on Neon Free Tier)
- **Frontend Hosting**: Vercel
- **Backend Hosting**: Render / Railway
- **Dev Tools**: Git, GitHub, Postman, pgAdmin, IntelliJ IDEA / VS Code
</technology_stack>

<directory_layout>
## Target Workspace Directory Structure

### Backend Package Structure (`mentora-backend`)
```text
mentora-backend/
├── src/
│   ├── main/
│   │   ├── java/com/mentora/
│   │   │   ├── config/             # Security, CORS, Swagger, WebSocket & JPA Config
│   │   │   ├── controller/         # REST & WebSocket Controllers
│   │   │   ├── dto/                # Request / Response Data Transfer Objects
│   │   │   ├── entity/             # JPA Entities & Enum definitions
│   │   │   ├── exception/          # Global Exception Handler & Custom Exceptions
│   │   │   ├── repository/         # Spring Data JPA Repositories
│   │   │   ├── security/           # JWT Filter, UserDetailsService, AuthProvider
│   │   │   ├── service/            # Business Logic Interfaces & Implementation
│   │   │   ├── util/               # File Utilities, Audit Logger, PDF/Excel Exporter
│   │   │   └── websocket/          # STOMP Handshake Handler & Event Listeners
│   │   └── resources/
│   │       ├── application.yml     # Application Properties (Neon PG, SMTP, JWT)
│   │       └── db/migration/       # Liquibase / Flyway or Schema SQL scripts
├── pom.xml                         # Maven Dependencies
└── README.md
```

### Frontend Directory Structure (`mentora-frontend`)
```text
mentora-frontend/
├── public/
├── src/
│   ├── assets/                     # Logos, illustrations, static assets
│   ├── components/                 # Shared UI Components (shadcn/ui, Navbar, Sidebar, Modals)
│   ├── context/                    # AuthContext, ThemeContext, SocketContext
│   ├── hooks/                      # Custom React Hooks (useAuth, useSocket, useFetch)
│   ├── layouts/                    # MainLayout, DashboardLayout, AuthLayout
│   ├── pages/                      # Page Views by Feature
│   │   ├── admin/                  # Admin Management Pages
│   │   ├── teacher/                # Teacher Portal Pages
│   │   ├── student/                # Student Portal Pages
│   │   ├── auth/                   # Login, Register, Forgot Password
│   │   └── shared/                 # Chat, Forums, Announcements, Profile
│   ├── services/                   # Axios API Clients & Endpoints
│   ├── types/                      # TypeScript Interfaces & Types
│   ├── utils/                      # Helper Functions, Date Formatters, Constants
│   ├── App.tsx                     # React Router Routes & Auth Guards
│   ├── index.css                   # Tailwind Design Tokens & Global CSS
│   └── main.tsx                    # React Entry Point
├── package.json
├── tailwind.config.js
└── vite.config.ts
```
</directory_layout>

<database_schema>
## Data Dictionary & Database Schema Design

### Core Database Entities & Enums

#### Enums
- `Role`: `ROLE_STUDENT`, `ROLE_TEACHER`, `ROLE_ADMIN`
- `AssignmentStatus`: `PENDING`, `SUBMITTED`, `GRADED`, `LATE`
- `AttendanceStatus`: `PRESENT`, `ABSENT`, `LATE`, `EXCUSED`
- `NoticePriority`: `LOW`, `MEDIUM`, `HIGH`, `URGENT`
- `MaterialType`: `DOCUMENT`, `SLIDES`, `VIDEO_LINK`, `CODE_SAMPLE`, `ASSIGNMENT_FILE`
- `PostCategory`: `ACADEMIC`, `GENERAL`, `EXAM_PREP`, `PROJECTS`

#### Entities Table Summary

1. **`users`**: `id` (UUID/PK), `email` (UNIQUE), `password` (BCrypt), `first_name`, `last_name`, `role` (Enum), `phone_number`, `profile_picture_url`, `is_enabled`, `created_at`, `updated_at`.
2. **`departments`**: `id` (PK), `code` (UNIQUE), `name`, `description`.
3. **`courses`**: `id` (PK), `code` (UNIQUE), `name`, `department_id` (FK), `credits`.
4. **`students`**: `id` (PK), `user_id` (FK -> users, UNIQUE), `roll_number` (UNIQUE), `department_id` (FK), `course_id` (FK), `semester`, `cgpa`.
5. **`teachers`**: `id` (PK), `user_id` (FK -> users, UNIQUE), `employee_id` (UNIQUE), `department_id` (FK), `designation`, `qualification`.
6. **`subjects`**: `id` (PK), `code` (UNIQUE), `name`, `course_id` (FK), `department_id` (FK), `teacher_id` (FK -> teachers).
7. **`assignments`**: `id` (PK), `title`, `description`, `subject_id` (FK), `teacher_id` (FK), `due_date`, `max_marks`, `attachment_url`, `created_at`.
8. **`assignment_submissions`**: `id` (PK), `assignment_id` (FK), `student_id` (FK), `file_url`, `submitted_at`, `marks_obtained`, `feedback`, `status` (Enum).
9. **`attendance`**: `id` (PK), `subject_id` (FK), `student_id` (FK), `teacher_id` (FK), `date`, `status` (Enum), `remarks`.
10. **`study_materials`**: `id` (PK), `title`, `description`, `subject_id` (FK), `teacher_id` (FK), `file_url`, `material_type` (Enum), `uploaded_at`.
11. **`announcements`**: `id` (PK), `title`, `content`, `author_id` (FK -> users), `priority` (Enum), `target_department_id` (FK, Nullable), `created_at`.
12. **`messages`**: `id` (PK), `sender_id` (FK -> users), `recipient_id` (FK -> users, Nullable), `chat_room_id` (FK, Nullable), `content`, `sent_at`, `is_read`.
13. **`chat_rooms`**: `id` (PK), `name`, `is_group` (Boolean), `created_by` (FK -> users), `created_at`.
14. **`notifications`**: `id` (PK), `user_id` (FK), `title`, `message`, `type`, `is_read`, `created_at`.
15. **`discussion_posts`**: `id` (PK), `title`, `content`, `author_id` (FK -> users), `category` (Enum), `upvotes_count`, `created_at`.
16. **`discussion_replies`**: `id` (PK), `post_id` (FK), `author_id` (FK), `content`, `is_accepted_answer` (Boolean), `created_at`.
17. **`timetable`**: `id` (PK), `subject_id` (FK), `teacher_id` (FK), `day_of_week`, `start_time`, `end_time`, `room_number`.
18. **`audit_logs`**: `id` (PK), `user_id` (FK), `action`, `ip_address`, `timestamp`, `details`.
</database_schema>

<api_specifications>
## REST API & Route Architecture Map

### 1. Auth & Profile Operations
- `POST /api/v1/auth/register` — Public user registration (Student/Teacher request)
- `POST /api/v1/auth/login` — Returns JWT Access Token & User Payload
- `POST /api/v1/auth/forgot-password` — Sends password reset link via SMTP
- `GET  /api/v1/users/me` — Fetches current authenticated user profile
- `PUT  /api/v1/users/profile` — Updates profile info & avatar

### 2. Academic Management (Admin / Teacher)
- `GET/POST /api/v1/departments` — Department CRUD
- `GET/POST /api/v1/courses` — Course CRUD
- `GET/POST /api/v1/subjects` — Subject CRUD & Teacher Assignment
- `GET/POST /api/v1/timetable` — Fetch & Schedule Weekly Timetable

### 3. Assignments & Grading
- `GET/POST /api/v1/assignments` — Fetch / Create assignments (Teacher)
- `GET /api/v1/assignments/subject/{subjectId}` — Fetch assignments by subject
- `POST /api/v1/assignments/{id}/submit` — Student assignment file submission
- `PUT  /api/v1/assignments/submissions/{submissionId}/grade` — Teacher grades & leaves feedback

### 4. Attendance & Analytics
- `POST /api/v1/attendance/batch` — Bulk attendance marking for a class date
- `GET  /api/v1/attendance/student/{studentId}` — Fetch student attendance percentage
- `GET  /api/v1/analytics/dashboard` — Platform overview analytics (Admin/Teacher)

### 5. Study Materials & Announcements
- `POST /api/v1/materials/upload` — Upload study file (Multipart File)
- `GET  /api/v1/materials/subject/{subjectId}` — List materials for a subject
- `GET/POST /api/v1/announcements` — System / Department Announcements

### 6. Discussion Forum
- `GET/POST /api/v1/discussions/posts` — Get all posts with filtering / Create post
- `POST /api/v1/discussions/posts/{id}/reply` — Add reply to discussion post
- `PUT  /api/v1/discussions/posts/{id}/upvote` — Upvote post
</api_specifications>

<websocket_specifications>
## Real-Time Messaging & WebSocket Contract

- **Handshake Endpoint**: `/ws-mentora` (SockJS fallback enabled)
- **STOMP Protocol Broker Topics**:
  - Direct 1-on-1 Chat: `/user/{userId}/queue/messages`
  - Group / Class Chat: `/topic/room/{roomId}`
  - System Notifications: `/user/{userId}/queue/notifications`
  - Live Announcements Broadcast: `/topic/announcements`
- **Payload Schema**:
  ```json
  {
    "senderId": "UUID",
    "recipientId": "UUID",
    "roomId": "UUID",
    "content": "Message content text",
    "timestamp": "ISO-8601 String",
    "messageType": "CHAT | NOTIFICATION | ANNOUNCEMENT"
  }
  ```
</websocket_specifications>

<rbac_matrix>
## Role-Based Access Control (RBAC) Matrix

| Feature / Resource | Student | Teacher | Admin |
| :--- | :---: | :---: | :---: |
| Submit Assignments & View Grades | ✅ | ❌ | ❌ |
| Create Assignments & Grade Submissions | ❌ | ✅ | ✅ |
| Mark Class Attendance | ❌ | ✅ | ✅ |
| View Personal Attendance & Timetable | ✅ | ✅ | ✅ |
| Upload Study Materials | ❌ | ✅ | ✅ |
| Real-time 1-on-1 & Room Messaging | ✅ | ✅ | ✅ |
| Manage Users, Departments & Courses | ❌ | ❌ | ✅ |
| View Audit Logs & Export PDF/Excel | ❌ | ❌ | ✅ |
</rbac_matrix>

<ui_ux_design_system>
## UI/UX & Aesthetics Guidelines

1. **Design System & Theme**:
   - Palette: Deep Slate (`#0f172a`), Indigo Accent (`#6366f1`), Emerald Success (`#10b981`), Amber Warning (`#f59e0b`), Rose Error (`#f43f5e`).
   - Theme Support: Flawless Dark Mode & Light Mode using CSS Variables / Tailwind `dark:` classes.
   - Glassmorphism & Micro-Interactions: Subtle backdrop blurs (`backdrop-blur-md`), polished hover scales, smooth modal transitions, skeleton loading states.
2. **Typography & Layout**:
   - Primary Font: Inter / Outfit via Google Fonts.
   - Layout: Collapsible Sidebar + Sticky Header Navigation + Breadcrumbs + Responsive Mobile Drawer.
</ui_ux_design_system>

<phased_implementation_plan>
## Step-by-Step Implementation Strategy for AI Agents

To generate Mentora reliably, execute the implementation in 6 sequential phases:

### Phase 1: Database & Core Spring Boot Setup
- Initialize Spring Boot project with all Maven dependencies (`spring-boot-starter-web`, `spring-boot-starter-data-jpa`, `spring-boot-starter-security`, `spring-boot-starter-websocket`, `postgresql`, `jjwt`).
- Configure `application.yml` for Neon PostgreSQL connection, JWT secret keys, and SMTP settings.
- Implement JPA Entities, Enums, Repositories, and SQL DDL seed scripts.

### Phase 2: Security, JWT & User Auth Module
- Configure `SecurityFilterChain` with CORS, CSRF disabled for stateless REST, and JWT Authentication Filter.
- Build `AuthController` with `/login`, `/register`, `/forgot-password` endpoints.
- Implement BCrypt password encoder and custom `UserDetailsService`.

### Phase 3: Business Logic REST APIs
- Build DTOs, Services, and Controllers for Departments, Courses, Subjects, Assignments, Attendance, Study Materials, and Discussion Forum.
- Implement Spring Global Exception Handler (`@RestControllerAdvice`) returning standardized JSON error payloads.

### Phase 4: WebSocket Real-Time Infrastructure
- Configure WebSocket Message Broker (`@EnableWebSocketMessageBroker`).
- Implement Chat Controllers, STOMP event listeners, and real-time Notification Dispatcher.

### Phase 5: React Frontend Application
- Initialize Vite + React + TypeScript app with Tailwind CSS and shadcn/ui components.
- Set up Axios instance with JWT Auth Interceptor.
- Create Auth Layout, Dashboard Layouts (Student, Teacher, Admin), and Protected Route Guards.
- Build modular pages: Assignments, Attendance Manager, Chat Room, Material Center, Forum, Timetable, and Analytics.

### Phase 6: Seed Data, Polishing & Documentation
- Add comprehensive DB seed script containing test accounts (`student@mentora.com`, `teacher@mentora.com`, `admin@mentora.com` password: `Password123!`).
- Write complete project `README.md` with step-by-step instructions for running locally and deploying to Render, Vercel, and Neon.
</phased_implementation_plan>

<quality_assurance>
## Deliverables & Acceptance Criteria

- [x] Complete, compilable Spring Boot 3.x Backend codebase.
- [x] Complete Vite + React + TypeScript Frontend codebase.
- [x] PostgreSQL normalized database schema with sample seed data.
- [x] Functional JWT Authentication & RBAC enforcement across all endpoints.
- [x] Functional WebSockets real-time messaging between students and teachers.
- [x] Responsive, aesthetic UI supporting Light/Dark modes.
- [x] Zero unresolved compile errors or missing imports.
</quality_assurance>
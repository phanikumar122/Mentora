# Mentora — Complete Platform Feature Demonstration (`demo.md`)

Welcome to **Mentora**, a modern, full-stack educational platform built with **React 18**, **TypeScript**, **Tailwind CSS**, **Java 21 Spring Boot**, **Spring Security JWT**, and **STOMP WebSockets**.

---

## 🌟 Executive Summary & Key Highlights

- 🛡️ **Admin-Governed Security**: Public self-registration is disabled. User provisioning (Students, Teachers, Admins, Parents), department setup, and course allocation are managed exclusively by the System Administrator.
- 🏢 **Department-Mapped Course Allocation**: Courses are added and linked directly to specific university departments (e.g. Computer Science, Electrical Engineering) with course code, name, and credit definitions.
- 📅 **Course-Based Attendance Management**: Faculty and teachers mark class attendance per course section, persisting student attendance records by course in real-time.
- 👨‍👩‍👧 **Parent / Guardian Portal (`ROLE_PARENT`)**: Dedicated portal for parents to monitor their child's academic ward profile, real-time attendance rates, assignment submissions, course grades, and direct faculty chat.
- ⚡ **100% Real-Time & Dynamic**: Zero static seed data or dummy placeholders. All user records, assignments, announcements, forum posts, study materials, class rosters, and direct messages operate dynamically on real REST & STOMP APIs.
- 🗑️ **Global Administrative Deletion Governance**: Administrators hold full deletion rights across all platform entities (Users, Departments, Courses, Announcements, Discussion Threads, Assignments, Study Materials).
- 📁 **Multi-Format File Attachment Hub**: Upload and download study resources supporting PDF (`.pdf`), Word (`.doc`, `.docx`), Slides (`.ppt`, `.pptx`), Archives (`.zip`), Code files (`.java`, `.py`), and Videos (`.mp4`).
- 💬 **Directory Direct Messaging**: Live 2-second interval polling sync across multi-account sessions.

---

## 🔐 1. Admin-Governed Security & Authentication

### Features:
1. **Secure Sign In Portal (`/login`)**:
   - Single-entry authentication screen using JWT Bearer Tokens.
   - Pre-seeded System Administrator: `admin@mentora.com` / `Password123!`.
   - Security notice: *"Account creation and enrollment are managed exclusively by the System Administrator."*
2. **Role-Based Access Control (RBAC)**:
   - **`ROLE_ADMIN`**: Full platform control, user creation/deletion, student-to-teacher assignment, parent-student linking, department/course creation, and system audit exports.
   - **`ROLE_PARENT`**: Dedicated parent dashboard for monitoring child ward attendance, assignment progress, cumulative GPA, school announcements, and direct messaging with faculty.
   - **`ROLE_TEACHER`**: Assignment creation, study material file uploads, class roster attendance marking.
   - **`ROLE_STUDENT`**: View enrolled courses, submit assignment solutions, view attendance, upvote forum posts, and send messages.

---

## 🏢 2. Departments & Department-Mapped Course Creation (`/admin/departments`)

### Features:
1. **Add Department Modal**:
   - Define university departments with code (e.g. `CSE`, `ECE`), name, and description.
2. **Add Course mapped to Department (`+ Add Course`)**:
   - **Course Code**: e.g., `CS201`.
   - **Course Name**: e.g., `Data Structures & Algorithms`.
   - **Credits**: e.g., `4`.
   - **Department Selection**: Select target department from dynamic dropdown.
3. **Delete Department & Course**:
   - Trash buttons to delete obsolete departments (`DELETE /api/v1/departments/{id}`) and courses (`DELETE /api/v1/courses/{id}`).

---

## 📅 3. Course-Based Class Roster Attendance (`/attendance`)

### Features:
1. **Course Selection Dropdown**:
   - Faculty selects the specific Course (e.g., `CS201 - Data Structures & Algorithms`) for marking attendance.
2. **Dynamic Student Class Roster**:
   - Queries registered student accounts dynamically.
3. **Status Toggling & Persistence**:
   - Mark student status as **Present**, **Late**, or **Absent** and click **Save Course Roster** to persist records by course to database (`POST /api/v1/attendance/batch`).

---

## 👨‍👩‍👧 4. Parent / Guardian Portal & Ward Linking (`/dashboard` for Parent)

### Features:
1. **Parent Dashboard (`ParentDashboard.tsx`)**:
   - **Student Ward Academic Profile**: Displays child's full name, email, and enrollment status.
   - **Ward Attendance Tracking**: Monitors child's real-time attendance percentage (e.g. `95.4%`).
   - **Ward Assignment & Grade Log**: Review published assignments, due dates, marks, and solution status.
   - **Direct Faculty Communication**: One-click action button to chat directly with their child's designated Teacher/Faculty Mentor.
2. **Admin Parent-Ward Allocation (`/admin/users`)**:
   - **Link Parent to Student** modal: Administrator links a Parent user account to their student ward with relationship specification.

---

## 👥 5. User Governance & Faculty Allocation (`/admin/users`)

### Features:
1. **Create Accounts Modal**:
   - System Administrator creates Student, Teacher, Parent, or Admin accounts with First Name, Last Name, Email, Password, Role, and Phone Number.
2. **Link Student to Faculty Advisor / Teacher**:
   - **Assign Student to Teacher** action modal & **Link Teacher** quick-action button on Student table rows.
3. **Delete User Account**:
   - Red Trash button (`<Trash2 />`) on every user row to permanently purge user accounts (`DELETE /api/v1/users/{id}`).

---

## 📢 6. Official Announcements (`/announcements`)

### Features:
1. **Broadcast Notice Modal**:
   - Publish system notices with Title, Priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), and Message content.
2. **Real-Time Notice Feed**:
   - Displays notice broadcasts formatted with author details, priority badges, and timestamps.
3. **Delete Notice**:
   - Admin trash button to delete notices (`DELETE /api/v1/announcements/{id}`).

---

## 📚 7. Academic Assignments & Submissions (`/assignments`)

### Features:
1. **Create Assignment Modal (Teachers & Admins)**:
   - Enter Assignment Title, Description / Problem Statement, Max Marks (e.g., `100`), and automatically calculated due dates.
2. **Student Solution Submission Drawer**:
   - Interactive file dropzone for students to submit solution packages (`.pdf`, `.zip`, `.tar.gz`).
3. **Delete Assignment**:
   - Trash button for faculty and admins to purge assignments (`DELETE /api/v1/assignments/{id}`).

---

## 📁 8. Study Materials & Document Hub (`/materials`)

### Features:
1. **Multi-Format Upload Modal**:
   - Upload file resources supporting `.pdf`, `.doc`, `.docx`, `.ppt`, `.pptx`, `.txt`, `.zip`, `.java`, `.py`, `.mp4`.
   - Displays interactive drag-and-drop file picker with formatted file size badge (e.g., `2.4 MB`).
2. **Resource Cards**:
   - Displays resource category badge, description, filename attachment pill, and **Download File** action button.
3. **Delete Study Resource**:
   - Trash button to remove study files (`DELETE /api/v1/materials/{id}`).

---

## 💬 9. Q&A Academic Discussion Forum (`/forum`)

### Features:
1. **Ask Question Modal**:
   - Post academic questions under categories (`ACADEMIC`, `EXAM_PREP`, `PROJECTS`, `GENERAL`).
2. **Upvote Counter**:
   - Interactive upvote button increments upvote tally in real-time (`PUT /api/v1/discussions/posts/{id}/upvote`).
3. **Delete Thread**:
   - Admin trash button to delete forum threads (`DELETE /api/v1/discussions/posts/{id}`).

---

## ✉️ 10. Directory Direct Messaging (`/chat`)

### Features:
1. **Directory User Selection**:
   - Lists all registered users from `/api/v1/users` in the left directory sidebar.
2. **Live 2-Second Sync**:
   - Auto-polls direct messages every 2 seconds (`GET /api/v1/chat/messages/{senderId}/{recipientId}`).
3. **Message Bubble Alignment**:
   - Sent messages align right in brand blue; incoming messages align left in neutral gray.

---

## 📊 11. Grades & Course Credits (`/grades`)

### Features:
1. **Academic Performance Report**:
   - Cumulative GPA summary card (e.g. `3.85 / 4.0`).
2. **Registered Courses Overview**:
   - Queries course offerings dynamically from `/api/v1/courses` with credit allocations.

---

## 🛠️ 12. Control Center & Audit Tools (`/dashboard` for Admin)

### Features:
1. **Metric Overview Cards**:
   - Total Registered Users, Active Departments, Offered Courses, and System Health (`99.9%`).
2. **Trigger Database Backup**:
   - Performs database snapshot and appends log entry to system audit stream.
3. **Export Reports**:
   - Dynamically generates and downloads system audit report text files (`Mentora_System_Report.txt`).

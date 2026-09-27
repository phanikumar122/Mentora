# Mentora — Admin-Governed Security & Operations Guide

This guide provides instructions for running and operating **Mentora**.

> 🛡️ **Strict Admin Security Policy**: Public self-registration is disabled. Account creation (Students, Teachers, Admins), department setup, and course allocation are restricted exclusively to the **System Administrator**.

---

## 🔑 Default Administrator Credentials

Upon starting the backend, the system automatically initializes the primary Administrator account:

- **Email**: `admin@mentora.com`
- **Password**: `admin@mentora`
- **Role**: `ROLE_ADMIN`

---

## 🚀 How to Run the Platform

### 1. Start the Backend API Service (`mentora-backend`)

**On Windows (CMD / PowerShell):**
```cmd
cd mentora-backend
.\mvnw.cmd spring-boot:run
```

- **Backend API**: `http://localhost:8081`
- **Health Check API (UptimeRobot / Monitoring)**: `http://localhost:8081/health` or `http://localhost:8081/api/v1/health`
- **Swagger OpenAPI Docs**: `http://localhost:8081/swagger-ui.html`

### 2. Start the Web Client (`mentora-frontend`)

**In a new terminal window:**
```cmd
cd mentora-frontend
npm run dev
```

- **Web Portal**: `http://localhost:3000`

---

## 👥 How Administrator Manages Accounts & Academic Allocations

1. Log into `http://localhost:3000` as `admin@mentora.com` / `admin@mentora`.
2. Navigate to **Manage Users** (`/admin/users`) to create **Student**, **Teacher**, or **Administrator** accounts.
3. Navigate to **Manage Departments** (`/admin/departments`) to define university departments and offered courses.
4. Newly created Student and Teacher credentials can then be used to log into their respective portals!

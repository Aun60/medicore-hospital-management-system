# 🏥 MediCore Hospital Management System

**Smart Hospital Management, Simplified.**

MediCore is a full-stack, role-based Hospital Management System designed to simulate a realistic hospital workflow across administrators, receptionists, doctors, and patients.

The project originally started as a console-based Hospital Management System written in C. It was redesigned and rebuilt as a modern full-stack web application with a responsive frontend, REST API, MongoDB database, JWT-based authentication, and Role-Based Access Control (RBAC).

## 🌐 Live Application

**Live Website:**  
https://medicore-hospital-management-system-navy.vercel.app

**GitHub Repository:**  
https://github.com/Aun60/medicore-hospital-management-system

## 🔑 Demo Access

### Patient Account

- **Username:** `afzal52`
- **Password:** `123`

> Administrative credentials are not publicly shared.

Patients can also create their own account through the Patient Registration functionality. Each registered patient is automatically assigned a unique Patient ID.

---

# ✨ Key Features

## 🔐 Authentication & Role-Based Access Control

MediCore implements JWT-based authentication with four different user roles:

- Administrator
- Receptionist
- Doctor
- Patient

Each role has its own permissions and can only access functionality relevant to its responsibilities.

---

## 👨‍💼 Administrator

The Administrator has the highest level of system access.

Key capabilities include:

- View hospital dashboard and statistics
- View and manage patients
- Add and edit patient information
- Discharge patients
- Add new doctors
- Edit doctor information
- Deactivate/remove doctors
- View and manage appointments
- View medical records
- Create and manage staff accounts
- Create Receptionist and Doctor accounts
- Link Doctor accounts with existing Doctor IDs
- View system users

---

## 🧑‍💻 Receptionist

The Receptionist handles administrative and front-desk hospital operations.

Key capabilities include:

- View hospital dashboard
- View registered patients
- Register/add patients
- Edit patient information
- Discharge patients
- View available doctors
- Schedule appointments between patients and doctors
- View appointments

Receptionists are restricted from accessing sensitive clinical and medical records.

---

## 👨‍⚕️ Doctor

Doctors have access to clinical information relevant to their assigned patients.

Key capabilities include:

- View personal dashboard
- View assigned appointments
- View patients assigned to them
- Access relevant patient information
- View medical records associated with their work
- Add diagnoses
- Add prescriptions
- Add clinical notes and medical records

Doctors cannot manage unrelated patients, staff accounts, or administrative hospital operations.

---

## 🧑‍🦱 Patient

Patients have a restricted self-service portal focused entirely on their own information.

Key capabilities include:

- Self-register for a patient account
- Automatically receive a unique Patient ID
- Securely log in to their account
- View their own patient profile
- View their own appointments
- View their own medical records

Patients cannot:

- View other patients
- View other patients' medical records
- Add or manage doctors
- Schedule appointments directly
- Access administrative features

This ensures proper separation of permissions between hospital staff and patients.

---

# 🆔 Unique Patient Identification

When a patient registers through the application, MediCore automatically generates a unique Patient ID.

This ID can then be used by authorized hospital staff for:

- Patient identification
- Appointment scheduling
- Patient record management
- Doctor assignment
- Medical record association

This creates a consistent link between patient accounts and hospital operations.

---

# 📅 Appointment Management

Authorized staff can schedule appointments by connecting:

- Patient ID
- Doctor ID
- Appointment date
- Appointment time
- Reason for appointment

Patients can view only their own appointments, while doctors can view appointments assigned to them.

---

# 🩺 Medical Record Management

Clinical records are protected through role-based permissions.

Doctors can create medical records for patients assigned to them, including:

- Diagnosis
- Prescription
- Clinical notes

Patients can view their own medical records.

Receptionists cannot access clinical records.

---

# 🛠️ Tech Stack

## Frontend

- React
- Vite
- JavaScript
- CSS
- Lucide React Icons

## Backend

- Python
- FastAPI
- Uvicorn
- REST API

## Database

- MongoDB
- MongoDB Atlas
- PyMongo

## Authentication & Security

- JWT Authentication
- Password Hashing
- Role-Based Access Control (RBAC)
- Protected API Endpoints
- CORS Configuration

## Deployment

- Vercel - Frontend
- Render - Backend
- MongoDB Atlas - Cloud Database
- GitHub - Source Code & Version Control

---

# 🏗️ Project Architecture

```text
medicore-hospital-management-system/
│
├── backend/
│   └── app/
│       └── main.py
│
├── frontend/
│   ├── src/
│   ├── package.json
│   └── ...
│
├── requirements.txt
├── .gitignore
└── README.md
```

The React frontend communicates with the FastAPI backend through REST API requests.

The FastAPI backend handles authentication, authorization, business logic, and communication with MongoDB Atlas.

```text
React + Vite Frontend
        ↓
   REST API
        ↓
FastAPI Backend
        ↓
 MongoDB Atlas
```

---

# ⚙️ Environment Variables

Create a `.env` file for the backend:

```env
MONGODB_URL=your_mongodb_connection_string
DATABASE_NAME=medicore_hms
JWT_SECRET=your_secure_jwt_secret
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_admin_password
FRONTEND_URL=http://localhost:5173
```

Create a frontend environment variable:

```env
VITE_API_URL=http://localhost:8000
```

> Never commit `.env` files, MongoDB credentials, JWT secrets, or production credentials to GitHub.

---

# 🚀 Running Locally

## Backend

Install the required Python dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI backend:

```bash
uvicorn app.main:app --reload
```

Depending on your working directory, the module path may need to be adjusted to match the backend folder structure.

## Frontend

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

---

# 🔒 Security & Access Control

MediCore follows a role-based authorization model where frontend visibility and backend API permissions are controlled according to the authenticated user's role.

Sensitive operations are protected on the backend rather than relying solely on hiding frontend UI elements.

This prevents unauthorized users from accessing protected operations simply by calling API endpoints directly.

---

# 💡 Project Background

MediCore represents the modernization of an existing console-based Hospital Management System originally implemented in C.

Instead of discarding the original project concept, the system was redesigned for the web while preserving its core hospital management functionality and expanding it with:

- Modern web architecture
- Persistent cloud database storage
- Authentication
- Role-based permissions
- Patient self-registration
- Unique patient identification
- Multi-role portals
- Clinical record management
- Cloud deployment

The result is a significantly more realistic full-stack hospital management application.

---

# 👨‍💻 Author

**Aun Ali Kazi**

BS Artificial Intelligence  
FAST - National University of Computer and Emerging Sciences

---

## 📌 Disclaimer

MediCore is a portfolio and educational project designed to demonstrate full-stack development, database integration, authentication, authorization, and role-based hospital workflows.

It is not intended for real-world clinical use without additional security, privacy, compliance, auditing, encryption, and regulatory controls.
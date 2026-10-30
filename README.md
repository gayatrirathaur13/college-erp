# College ERP System

Full-stack University / College ERP system featuring multi-role portals for Students, Faculty, and Staff with dynamic academic records, fee tracking, attendance, library, placements, and grading.

---

## 📋 System Requirements

Ensure the following prerequisites are installed before running:
- **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
- **npm**: v9.0.0 or higher (comes bundled with Node.js)
- **OS**: Windows, macOS, or Linux

*(See `requirements.txt` for the full dependency list)*

---

## 🚀 Quick Start (Step-by-Step)

### Option 1: 1-Click Launch (Windows)
Double-click [`start-erp.bat`](./start-erp.bat) in the project folder. It will:
1. Automatically install any missing dependencies.
2. Launch the website on `http://localhost:3000`.
3. Open your browser automatically.

---

### Option 2: Command Line (Step-by-Step for Everyone)

#### Step 1: Open Terminal in Project Directory
Open PowerShell, CMD, or Terminal in the `college-erp` folder:
```bash
cd college-erp
```

#### Step 2: Install Dependencies
Run the installation for the frontend and root workspace:
```bash
npm install
```

*(Optional: Install backend dependencies if running local API server)*
```bash
cd server
npm install
cd ..
```

#### Step 3: Run the Application

**To start Frontend + Backend together:**
```bash
npm start
```

**Or to run Frontend only (with built-in reactive demo data):**
```bash
npm run dev
```

#### Step 4: Open in Browser
Visit:
```
http://localhost:3000
```

---

## 🔑 Demo Test Accounts

You can click the quick demo chips on the login page or enter these credentials:

| Role | Username / ID | Password | Notes |
| :--- | :--- | :--- | :--- |
| **Student** | `31001` or `f24ce001@student.example.edu` | `Kavya@31001` | Computer Science, 90% attendance, fee & placement data |
| **Student** | `31002` or `f24ce002@student.example.edu` | `Siddharth@31002` | High CGPA, TCS application |
| **Faculty** | `FAC-001` or `faculty1@example.edu` | `Ashwini@FAC001` | Associate Professor, CS Department |
| **Staff** | `TNP-HEAD` | `TNP@Campus2026` | Training & Placement Head Portal |
| **Staff** | `FINANCE` | `Finance@2026` | Accounts & Fee Collection Portal |
| **Staff** | `LIBRARIAN` | `Library@2026` | Library Circulation & Books Catalog |

---

## 🛠 Available Scripts

| Command | Action |
| :--- | :--- |
| `npm start` | Runs both backend (`:5000`) and frontend (`:3000`) concurrently |
| `npm run dev` | Runs the Vite frontend development server on port 3000 |
| `npm run server` | Runs the Express backend server on port 5000 |
| `npm run build` | Compiles TypeScript and creates optimized production build |

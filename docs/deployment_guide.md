# Pulsecare - Deployment & Operations Guide (Member 1)

This guide provides setup and execution instructions for Member 1 of the Hospital Management System (HMS), covering database seeding, local development launches, running unit/integration testing suites, and launching via Docker Compose.

---

## 1. Prerequisites
Ensure the following tools are installed locally:
- **Node.js**: v20.x LTS or higher
- **npm**: v10.x or higher
- **MongoDB**: v6.x or higher (or a MongoDB Atlas connection URI)
- **Docker & Docker Compose** (optional, for containerized deployments)

---

## 2. Environment Variables (.env)
A default configuration file has been written to `backend/.env`. If you need to make changes (such as connecting to MongoDB Atlas, configuring Cloudinary private file attachments, or custom SMTP servers), open and edit `backend/.env`.

---

## 3. Local Installation & Development

### 3.1 Setup Backend
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Seed the database with the default Super Admin, staff roles, and patient demographic sheet:
   ```bash
   npm run seed
   ```
4. Start the backend developer API server:
   ```bash
   npm run dev
   ```
   The backend server runs on [http://localhost:5000](http://localhost:5000).

### 3.2 Setup Frontend
1. Open a separate terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development dashboard server:
   ```bash
   npm run dev
   ```
   The frontend application runs on [http://localhost:5173](http://localhost:5173).

---

## 4. Default Seed Accounts for Testing
When you execute `npm run seed` in the backend, the following accounts are initialized:

| Role | Email | Password | Linked Demographic Profile |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@hms.com` | `SuperAdmin123!` | None |
| **Hospital Admin**| `admin@hms.com` | `Admin123!` | None |
| **Doctor** | `doctor@hms.com` | `Doctor123!` | None |
| **Nurse** | `nurse@hms.com` | `Nurse123!` | None |
| **Receptionist** | `receptionist@hms.com`| `Receptionist123!`| None |
| **Lab Technician**| `labtech@hms.com` | `Labtech123!` | None |
| **Pharmacist** | `pharmacist@hms.com` | `Pharmacist123!` | None |
| **Billing Exec** | `billing@hms.com` | `Billing123!` | None |
| **Patient** | `patient@hms.com` | `Patient123!` | Profile ID: `PT-20260617-0001` |

---

## 5. Running Tests

### 5.1 Unit Tests
Runs unit tests validating authentication middlewares, role permissions, and token hashing.
```bash
cd backend
npm run test
```

### 5.2 Test Coverage Report
To view unit and integration code coverage:
```bash
npm run test:coverage
```

---

## 6. Docker Container Deployment
To boot the complete multi-tier system (MongoDB, Express API, and React dashboard) using a single command:

1. Navigate to the root folder (where `docker-compose.yml` resides).
2. Spin up the containers (compiling frontend and backend Dockerfiles):
   ```bash
   docker-compose up --build -d
   ```
3. View runtime container logs:
   ```bash
   docker-compose logs -f
   ```
4. Access the applications:
   - **React Dashboard**: [http://localhost](http://localhost) (mapped to Port 80)
   - **Express REST API**: [http://localhost:5000](http://localhost:5000) (mapped to Port 5000)

To tear down the containers and preserve persistent database volumes:
```bash
docker-compose down
```
To purge persistent volumes as well:
```bash
docker-compose down -v
```

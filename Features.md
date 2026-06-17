# AuraHMS - Feature Directory & Manual Testing Guide

Welcome to the **AuraHMS** AI-Powered Hospital Portal. This document serves as a complete feature directory and manual testing guide. It lists every system role, login credentials, and step-by-step instructions to verify that all modules are working as expected.

---

## 1. System Roles and Login Credentials

The system is seeded with 9 default roles. You can log in using the credentials below (Password is the same for all role accounts, unless noted otherwise):

**Default Password:** `SuperAdmin123!` (for Super Admin) and `Admin123!` or role-specific passwords (e.g. `Doctor123!`, `Patient123!`, etc.) as specified below.

| Role | Email | Password | Home Page Redirect | Allowed Features |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@hms.com` | `SuperAdmin123!` | Admin Control Center | All Admin controls, Analytics, Operations AI, Audits, Bed Grid, Room Allocation, Laboratory, Pharmacy, Emergency Room, AI Assistant Chat, Pill Explainer, EMR, Billing & Invoices, Revenue Ledger, Notifications |
| **Hospital Admin** | `admin@hms.com` | `Admin123!` | Admin Control Center | Admin controls, Analytics, Operations AI, Patient Registry, Appointments, Inpatient Desk, Bed Grid, Room Allocation, Laboratory, Pharmacy, Billing & Invoices, Revenue Ledger, Emergency Room, AI Assistant Chat, Pill Explainer, EMR, Notifications |
| **Doctor** | `doctor@hms.com` | `Doctor123!` | Doctor Consultation Queue | Patient Registry, Appointments, Inpatient Desk, Bed Grid, Laboratory, Pharmacy, Emergency Room, AI Assistant Chat, Pill Explainer, Clinical Notes & Files, Notifications |
| **Nurse** | `nurse@hms.com` | `Nurse123!` | Patient Registry | Patient Registry, Appointments, Inpatient Desk, Bed Grid, Room Allocation, Laboratory, Pharmacy, Emergency Room, AI Assistant Chat, Pill Explainer, Clinical Notes & Files, Notifications |
| **Receptionist** | `receptionist@hms.com` | `Receptionist123!` | Patient Registry | Patient Registry, Appointments, Inpatient Desk, Bed Grid, Room Allocation, Emergency Room, AI Assistant Chat, Notifications |
| **Lab Technician** | `labtech@hms.com` | `Labtech123!` | Laboratory Dashboard | Laboratory, Clinical Notes & Files, Notifications |
| **Pharmacist** | `pharmacist@hms.com` | `Pharmacist123!` | Pharmacy Dashboard | Pharmacy, AI Pill Explainer, Clinical Notes & Files, Notifications |
| **Billing Executive**| `billing@hms.com` | `Billing123!` | Notification Logs | Billing & Invoices, Revenue Ledger, Notifications |
| **Patient** | `patient@hms.com` | `Patient123!` | Medical Records Timeline | My Profile, My Medical Records, Appointments, Inpatient Desk, AI Chat Concierge, AI Symptom Analyzer, AI Pill Explainer, Billing & Invoices, Notifications |

---

## 2. Modules & Feature Walkthrough

### 2.1 Core Authentication & Session Protection
* **Features**:
  * OAuth-compliant JWT and Refresh Token flows (HTTP-only cookie protection).
  * Auto-refresh session handling when access tokens expire.
  * Role-Based Access Control (RBAC) guards on client routes and backend APIs.
* **How to Test**:
  1. Open the app in your browser (typically `http://localhost:5173/login`).
  2. Attempt to log in with an invalid email or password; verify the error notification popup.
  3. Log in with a valid account (e.g., `doctor@hms.com` / `Doctor123!`). Verify that the application dashboard redirects you based on your role.
  4. Manually try to navigate to `/ai/operations` as a Doctor; you should be blocked or redirected to the home page with access denied due to RBAC guards.
  5. Click the "Logout" button in the upper right. Verify that your session is destroyed and you are redirected back to the login page.

---

### 2.2 Patient Registry & Demographic Intake
* **Access Roles**: `Hospital Admin`, `Receptionist`, `Doctor`, `Nurse`
* **Features**:
  * Alphanumeric Patient ID Generation (`PT-YYYYMMDD-XXXX`).
  * Structured intake form for demographics, blood group, emergency contacts, and allergies.
  * Search and filter interface for patients.
* **How to Test**:
  1. Log in as a Receptionist (`receptionist@hms.com` / `Receptionist123!`).
  2. Click **Patient Registry** on the sidebar.
  3. Click **Add Patient** to open the intake form.
  4. Enter details (First Name, Last Name, Gender, DOB, Phone, Emergency Contact Name, Relation, Phone). Add optional values like Blood Group and Allergies.
  5. Click **Submit**. Verify that the patient is added to the list and receives a unique Patient ID (e.g., `PT-20260617-0001`).
  6. Use the Search bar to filter the patients list by first name or Patient ID.

---

### 2.3 Electronic Medical Records (EMR) & Clinical Attachments
* **Access Roles**: `Doctor`, `Nurse` (Read/Write EMR); `Lab Technician`, `Pharmacist` (Read EMR); `Patient` (Read self EMR)
* **Features**:
  * Longitudinal EMR Timeline displaying vitals, clinical progress notes, and ICD-10 diagnoses.
  * Cloudinary-integrated medical attachments upload (PDF, JPG, PNG).
* **How to Test**:
  1. Log in as a Doctor (`doctor@hms.com` / `Doctor123!`).
  2. Go to **Patient Registry**, find a patient (e.g., John Doe), and click **View EMR**.
  3. You will see the historical EMR logs. Click **New Encounter Record** or **Add Clinical Note**.
  4. Fill in:
     * Vitals: Blood Pressure (e.g., `120/80`), Heart Rate (e.g., `72`), Temperature (e.g., `98.6`).
     * Clinical Notes: Detailed summary of symptoms and treatment plan.
     * Diagnosis: ICD-10 Code (e.g., `J11.1` for Influenza) and diagnosis name.
     * Prescriptions: Drug name, dosage, frequency, and duration.
  5. Under **Attachments**, click **Choose File** to select an image or PDF. Click **Upload**.
  6. Click **Save EMR**. Verify that the new encounter block renders in the patient's EMR timeline and includes the clickable uploaded attachment.

---

### 2.4 Doctor Consultation Workspace
* **Access Roles**: `Doctor`
* **Features**:
  * Real-time consultation queue.
  * Interactive SOAP notes workplace.
  * Direct lab test order and pharmacy prescription release.
* **How to Test**:
  1. Log in as a Doctor (`doctor@hms.com` / `Doctor123!`).
  2. Click **Consultation Queue** in the sidebar.
  3. Select an active patient from the queue to load the **Consultation Workspace**.
  4. Write Vitials, SOAP clinical notes, Diagnoses, and prescribe medications.
  5. Add a **Lab Request** directly from the workspace (e.g., Blood Test, Lipid Profile).
  6. Click **Complete Consultation**. Verify that the patient status updates to "Completed" and the record is updated in the EMR.

---

### 2.5 Appointment Management
* **Access Roles**: `Receptionist`, `Doctor`, `Nurse`, `Patient` (Self-booking)
* **Features**:
  * Interactive schedule calendar or list.
  * Time-slot availability tracking.
  * Appointment booking, status updates (Scheduled, Completed, Cancelled).
* **How to Test**:
  1. Log in as a Patient (`patient@hms.com` / `Patient123!`).
  2. Navigate to **Appointments**.
  3. Click **Book Appointment**. Select a doctor, select a date, and select a time slot.
  4. Click **Book**. Verify that the appointment appears as "Scheduled" on your dashboard.
  5. Log in as a Doctor (`doctor@hms.com` / `Doctor123!`). Go to **Appointments** or **Consultation Queue** and verify that the patient's appointment is listed.
  6. The Doctor/Receptionist can mark the appointment status as "Completed" or cancel it.

---

### 2.6 Laboratory Scans & Results Upload
* **Access Roles**: `Doctor`, `Nurse` (Order tests); `Lab Technician` (Process and upload results); `Patient` (View reports)
* **Features**:
  * Order status workflow: `Ordered` -> `Sample Collected` -> `Processing` -> `Completed`.
  * Diagnostic attachment uploads.
* **How to Test**:
  1. Log in as a Lab Technician (`labtech@hms.com` / `Labtech123!`).
  2. Click **Lab Testing** on the sidebar.
  3. You will see a queue of ordered laboratory tests. Select a pending test request.
  4. Click **Collect Sample** (changes status to Sample Collected).
  5. Click **Process Lab Request** (status changes to Processing).
  6. Fill in the **Results Findings** text box, upload a scan report attachment (PDF/image), and click **Complete Lab Request**.
  7. Verify that the lab request is moved to the "Completed" tab and is now accessible in the patient's EMR.

---

### 2.7 Pharmacy Inventory & Prescription Dispensing
* **Access Roles**: `Pharmacist` (Dispense & Inventory); `Doctor`, `Nurse` (Read stocks)
* **Features**:
  * Real-time medicine stock list with reorder levels.
  * Prescription dispensing queue.
* **How to Test**:
  1. Log in as a Pharmacist (`pharmacist@hms.com` / `Pharmacist123!`).
  2. Click **Pharmacy** on the sidebar.
  3. Under **Medicine Directory**, check active stocks. You can click **Add Medicine** or **Update Stock** to adjust quantities.
  4. Click **Dispense Queue** to view pending prescriptions ordered by Doctors.
  5. Select a patient's prescription and click **Dispense Prescription**. Specify the batch number and click confirm.
  6. Verify that the medicine stock count drops by the dispensed amount and the queue item updates to "Dispensed".

---

### 2.8 Inpatient Admission & Bed Allocation
* **Access Roles**: `Doctor`, `Nurse`, `Receptionist` (Manage admissions); `Patient` (View admission)
* **Features**:
  * Inpatient desk registration (admit patient, room request details).
  * Interactive **Bed Grid** showing occupied and available beds across different wards (General, ICU, Private).
  * Ward and room creation and management.
* **How to Test**:
  1. Log in as a Nurse (`nurse@hms.com` / `Nurse123!`).
  2. Navigate to **Room Allocation** or **Bed Grid** to see available rooms.
  3. Click **Inpatient Desk** and click **Admit Patient**.
  4. Select a Patient, select a target Ward (e.g. ICU), select a Room, and assign an available Bed (e.g. Bed-1). Set the admitting Doctor and admission reason.
  5. Click **Admit**. Verify that Bed-1 status changes to "Occupied" in the **Bed Grid** and the patient is listed in the inpatient active directory.
  6. To discharge a patient, select the active admission card from the **Inpatient Desk** and click **Discharge Patient**. Verify that the bed returns to "Available" status.

---

### 2.9 Emergency Department Command
* **Access Roles**: `Receptionist`, `Doctor`, `Nurse`
* **Features**:
  * Emergency admission intake.
  * Color-coded **Triage Tiers**: **Red** (Resuscitation/Critical), **Yellow** (Urgent), **Green** (Less Urgent).
  * Live status transitions (Triage, Under Evaluation, Admitted, Discharged).
* **How to Test**:
  1. Log in as a Nurse (`nurse@hms.com` / `Nurse123!`).
  2. Navigate to **Emergency Room**.
  3. Click **Register Emergency Incident**.
  4. Input: Patient Name (or Anonymous/Unidentified Patient), Triage Level (Red, Yellow, Green), Chief Complaint, and Bed/Area allocation.
  5. Click **Submit**. Verify that the card is color-coded on the dashboard (e.g. Red for Critical).
  6. Click on the emergency card to transition the patient status (e.g. from Triage -> Under Evaluation -> Discharged or Admitted to Inpatient).

---

### 2.10 AI-Powered Healthcare Assistants
* **Access Roles**: `Patient`, `Doctor`, `Nurse`, `Receptionist`
* **Features**:
  * **AI Symptom Analyzer**: Checks symptoms and returns risk, urgency, possible conditions, and recommended departments.
  * **AI Pill Explainer**: Details dosage instructions, side effects, precautions, and dietary recommendations for any drug name.
  * **AI Chat Concierge**: Appointment assistant that matches text query strings to doctors' specialties and available slots.
  * **AI Operations Intelligence** (Admins only): Answers strategic business queries using live metrics data context.
* **How to Test**:
  1. Log in as a Patient (`patient@hms.com` / `Patient123!`).
  2. Navigate to **AI Symptom Analyzer**.
  3. Select symptoms (e.g., Fever, Cough, Fatigue) or enter a custom description, then click **Analyze**. Verify that the AI returns structured possible conditions, risk/urgency levels, and a medical department recommendation.
  4. Navigate to **AI Pill Explainer**.
  5. Enter a drug name (e.g., `Paracetamol` or `Amoxicillin`) and click **Explain**. Verify that details on dosage, side effects, and warnings are rendered.
  6. Go to **AI Chat Concierge**. Type: *"I have a child with a high fever, who should I see next Monday?"*. Verify that the AI recommends a pediatrician, proposes Dr. Sarah Smith, and displays booking time slots.
  7. Log in as a Hospital Admin (`admin@hms.com` / `Admin123!`). Go to **Operations AI** and type *"Show me the revenue projection details"* to receive executive summary insights and forecasts.

---

### 2.11 Billing, Invoicing & Payments
* **Access Roles**: `Billing Executive`, `Hospital Admin` (Manage & View); `Patient` (Pay self invoices)
* **Features**:
  * Consolidated billing compiler.
  * Add individual charge items (Consultations, Lab requests, Pharmacy dispenses).
  * Secure Mock Credit Card payment checkout form.
  * Financial Revenue Ledger.
* **How to Test**:
  1. Log in as a Billing Executive (`billing@hms.com` / `Billing123!`).
  2. Click **Billing & Invoices**.
  3. Click **Create Invoice / Generate Invoice**. Select a patient (e.g., John Doe).
  4. The screen will automatically fetch unbilled items (completed consultations, completed lab requests, dispensed medicines).
  5. Check/select the items you want to invoice, add any custom charges (e.g., Room rent, tax), and click **Generate Invoice**. Verify that the invoice state is "Unpaid".
  6. Log in as a Patient (`patient@hms.com` / `Patient123!`). Go to **Billing & Invoices**.
  7. Find the newly generated invoice and click **Pay Now**.
  8. Enter mock credit card details (Card number, Expiry, CVV) and click **Submit Payment**. Verify that the invoice state transitions to "Paid" immediately and shows a green checkmark.
  9. Log in as a Hospital Admin (`admin@hms.com` / `Admin123!`). Go to **Revenue Ledger** to view charts indicating updated overall collection revenues.

---

### 2.12 Reports & Analytics Dashboard
* **Access Roles**: `Super Admin`, `Hospital Admin`
* **Features**:
  * Data visualization charts (MUI X-Charts / Recharts).
  * Metrics: Occupancy rates, billing revenue streams, doctor workload distributions, patient registry demographics.
* **How to Test**:
  1. Log in as a Hospital Admin (`admin@hms.com` / `Admin123!`).
  2. Navigate to **System Analytics** (or home page dashboard widgets).
  3. Verify that cards show active numbers (Total Patients, Bed Occupancy Percentage, Total Revenue).
  4. Check the visual charts representing:
     * Room occupancy breakdowns.
     * Monthly revenue collections.
     * Doctor appointment counts.

---

### 2.13 Compliance Audit Logging
* **Access Roles**: `Super Admin`, `Hospital Admin`
* **Features**:
  * Immutable, permanent log entries generated on any security-sensitive or data-modifying operation.
  * Capture user, action name, resource, resource ID, IP address, user agent, and before/after state diff.
* **How to Test**:
  1. Perform any action in the portal (e.g., change a patient profile demographic field or create an EMR record).
  2. Log in as a Super Admin (`superadmin@hms.com` / `SuperAdmin123!`).
  3. Click **Admin Control Center** or check **Audit Logs** (under the admin page / audit ledger section).
  4. Verify that the action is logged at the top, displaying the timestamp, performing user email, IP address, affected resource, and details of the changes.

---

### 2.14 Real-Time Notification Center
* **Access Roles**: All Roles
* **Features**:
  * Transactional email sending.
  * In-app Notification Bell counter.
  * Notification history list.
* **How to Test**:
  1. Log in as a Doctor or Patient.
  2. When an event happens (e.g., an appointment is booked or a lab test completed), check the **Notification Bell** icon in the upper right.
  3. Verify that the badge shows an unread notification count.
  4. Click the notification bell to view in-app alerts.
  5. Navigate to **Notification Logs** in the sidebar to view your historical alert messages log and mark notifications as read.

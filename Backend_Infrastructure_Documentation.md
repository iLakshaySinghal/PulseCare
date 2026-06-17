# Enterprise AI-Powered Hospital Management System (HMS)
## Backend & Infrastructure Architecture Documentation (Member 1)

This document provides a production-grade, implementation-ready architectural design for Member 1 (Backend & Infrastructure Lead). It details the database design, security patterns, authentication/RBAC flows, file storage, logging, notification systems, and testing pipelines required to build a compliant, secure, and highly scalable backend infrastructure.

---

## 1. Module Overview

Member 1 is responsible for building the core foundation and infrastructure of the Hospital Management System. The following list outlines the primary modules within this scope:
1. **Database & Infrastructure Foundation**: Multi-environment MongoDB Atlas setup, Mongoose integration, indexing strategies, and connection pooling.
2. **Authentication & RBAC**: OAuth-compliant JWT and Refresh Token flows, secure session management, and rigid Role-Based Access Control (RBAC) covering all 9 roles.
3. **Patient Management**: Patient intake, demographic data, demographic logs, and account association.
4. **Electronic Medical Records (EMR)**: Structuring patient charts, clinical notes, prescriptions, laboratory results, and secure medical file attachments.
5. **Audit Logging System**: Immutable log records documenting all security-sensitive and data-modifying operations for HIPAA compliance.
6. **Notification Service**: Centralized transactional notification engine supporting templated emails, retry logic, and event-driven logging.

---

## 2. Business Requirements

### BR-AUTH-01: Secure Authentication
The system must authenticate users across 9 distinct roles with unique permissions. Passwords must be hashed using a highly secure algorithm (bcrypt with custom work factor).

### BR-RBAC-02: Strict Least Privilege
Access control must be enforced at the gateway and router levels. A user must only access endpoints and records explicitly authorized by their assigned role.

### BR-PAT-03: Patient Lifecycle Management
Every patient must have a unique, system-generated Patient ID. Patient demographic data must be protected, auditable, and easily updatable by Receptionists, Admins, or Patients themselves (restricted fields).

### BR-EMR-04: HIPAA-Compliant Medical Records
EMR data must be encrypted in transit and at rest. Clinical files must be uploaded securely, scanned, and accessible only to authorized medical personnel (Doctors, Nurses, Lab Technicians) and the Patient.

### BR-AUD-05: Immutable Audit Trails
Any creation, deletion, or modification of EMR, patient files, or permission levels must generate a permanent, read-only audit log detailing *who*, *when*, *what file*, and the *before/after* state.

### BR-NOT-06: Reliable Transactional Alerts
Critical health actions (appointment booking, lab reports, prescription releases) must trigger real-time, templated email notifications.

---

## 3. Functional Requirements

### FR-AUTH-1.1: Authentication Actions
* **FR-AUTH-1.1.1**: User Login with password and email. Response must include short-lived Access Token in JSON response and Refresh Token in an HTTP-only, secure, SameSite cookie.
* **FR-AUTH-1.1.2**: Refresh Token rotation (RTR) on `/api/v1/auth/refresh` to issue a new access/refresh pair, invalidating the old refresh token immediately.
* **FR-AUTH-1.1.3**: Logout to revoke and delete the current refresh token from the database.

### FR-RBAC-2.1: Granular Role Routing
* **FR-RBAC-2.1.1**: The system must intercept every API request, decode the JWT, verify the role, and matches it against the endpoint’s allowed roles.

### FR-PAT-3.1: Patient Management Actions
* **FR-PAT-3.1.1**: Receptionist/Admin registers a new patient, auto-generating a unique alphanumeric Patient ID (`PT-YYYYMMDD-XXXX`).
* **FR-PAT-3.1.2**: Patient updates contact info, but cannot modify medical charts.

### FR-EMR-4.1: Record Actions
* **FR-EMR-4.1.1**: Doctors write clinical notes, prescribe medications, and order lab tests.
* **FR-EMR-4.1.2**: Nurses append vitals and notes to the EMR.
* **FR-EMR-4.1.3**: Lab Technicians upload medical images (PDF, JPG, PNG) to Cloudinary, auto-linking the Cloudinary secure URL to the patient's EMR.

### FR-AUD-5.1: Audit Logging Actions
* **FR-AUD-5.1.1**: Pre-save/Pre-update hooks in Mongoose must capture diffs on critical models and insert them into the `AuditLog` collection.

---

## 4. Non-Functional Requirements

### NFR-SEC-01: Compliance & Data Security
* **HIPAA/GDPR Alignment**: All data in transit must use TLS 1.3. EMR data must be encrypted at rest using AES-256 (MongoDB Atlas encryption).
* **Passwords**: Hashed with bcrypt (rounds = 12).
* **JWT Access Token Expiry**: 15 minutes.
* **Refresh Token Expiry**: 7 days.

### NFR-PERF-02: Latency & Throughput
* **API Response Time**: 95% of read operations must respond in < 150ms; writes in < 300ms.
* **Database Queries**: Read-heavy queries (e.g., patient lookup, auth checks) must utilize composite B-tree indexes to maintain low CPU load.

### NFR-AVAIL-03: Fault Tolerance & Availability
* **Database Availability**: Configured as a MongoDB Atlas 3-node replica set with automatic failover (99.99% SLA).
* **Storage Availability**: 99.99% uptime via Cloudinary multi-region CDN.

---

## 5. User Stories

### US-AUTH-01: Login & Access (Doctor)
* **As a** Doctor,
* **I want to** securely log into the portal,
* **So that** I can access my assigned patient charts.
* **Acceptance Criteria**:
  1. Login success yields an access token expiring in 15 minutes and sets a secure cookie containing a refresh token.
  2. Failure returns HTTP 401 with a sanitized message.
  3. All login attempts (success and fail) trigger an audit log.

### US-EMR-02: Adding EMR Entries (Nurse)
* **As a** Nurse,
* **I want to** add vital signs to a patient's EMR,
* **So that** the doctor can view updated metrics in real-time.
* **Acceptance Criteria**:
  1. Nurse must present a valid JWT.
  2. The system checks RBAC to ensure the Nurse role is authorized to update vitals.
  3. The record is updated and a notification is dispatched.

---

## 6. Use Case Diagram (PlantUML)

```plantuml
@startuml
left to right direction
skinparam packageStyle rectangle

actor "Patient" as pat
actor "Doctor" as doc
actor "Nurse" as nur
actor "Receptionist" as rec
actor "Lab Technician" as lab
actor "Pharmacist" as pha
actor "Billing Executive" as bil
actor "Hospital Admin" as h_adm
actor "Super Admin" as s_adm

rectangle "HMS Backend - Member 1" {
  usecase "Authenticate (Login/Logout/Refresh)" as UC_Auth
  usecase "Manage User Accounts" as UC_Users
  usecase "Register & Manage Patients" as UC_Patient
  usecase "Write/Modify EMR Clinical Notes" as UC_EMR_Write
  usecase "Upload EMR Files (Cloudinary)" as UC_EMR_Upload
  usecase "Read EMR & History" as UC_EMR_Read
  usecase "View Audit Logs" as UC_Audit_View
  usecase "Dispatch Notification" as UC_Notify
}

' Role inheritance relationships
s_adm --> h_adm

' Actor connections to usecases
pat --> UC_Auth
pat --> UC_EMR_Read

doc --> UC_Auth
doc --> UC_EMR_Read
doc --> UC_EMR_Write
doc --> UC_EMR_Upload

nur --> UC_Auth
nur --> UC_EMR_Read
nur --> UC_EMR_Write

rec --> UC_Auth
rec --> UC_Patient

lab --> UC_Auth
lab --> UC_EMR_Upload

pha --> UC_Auth
pha --> UC_EMR_Read

bil --> UC_Auth

h_adm --> UC_Users
h_adm --> UC_Audit_View

s_adm --> UC_Audit_View

UC_EMR_Write ..> UC_Notify : <<include>>
UC_EMR_Upload ..> UC_Notify : <<include>>
UC_EMR_Write ..> UC_Audit_View : <<triggers>>
@endum
```

---

## 7. Entity Relationship Diagram (ERD)

```plantuml
@startuml
' Layout styling
skinparam linetype ortho
skinparam class {
  BackgroundColor White
  ArrowColor Black
  BorderColor Black
}

entity "User" as user {
  * _id : ObjectId <<PK>>
  --
  * email : String
  * passwordHash : String
  * firstName : String
  * lastName : String
  * role : Enum(9 Roles)
  isActive : Boolean
  createdAt : Date
  updatedAt : Date
}

entity "RefreshToken" as token {
  * _id : ObjectId <<PK>>
  --
  * userId : ObjectId <<FK>>
  * token : String
  * expiresAt : Date
  * isRevoked : Boolean
  replacedByToken : String
  createdAt : Date
}

entity "Patient" as patient {
  * _id : ObjectId <<PK>>
  --
  * patientId : String <<Unique>>
  userId : ObjectId <<FK, Nullable>>
  * firstName : String
  * lastName : String
  * dateOfBirth : Date
  * gender : Enum
  * contactNumber : String
  * emergencyContact : Object
  bloodGroup : String
  allergies : Array[String]
  createdAt : Date
  updatedAt : Date
}

entity "EMR" as emr {
  * _id : ObjectId <<PK>>
  --
  * patientId : ObjectId <<FK>>
  * providerId : ObjectId <<FK>> (Doctor/Nurse)
  * encounterDate : Date
  * vitals : Object
  * clinicalNotes : String
  * diagnoses : Array[Object]
  prescriptions : Array[Object]
  attachments : Array[Object]
  createdAt : Date
  updatedAt : Date
}

entity "AuditLog" as audit {
  * _id : ObjectId <<PK>>
  --
  * userId : ObjectId <<FK>>
  action : String
  resource : String
  resourceId : String
  ipAddress : String
  userAgent : String
  changes : Object
  timestamp : Date
}

entity "Notification" as notify {
  * _id : ObjectId <<PK>>
  --
  * recipientId : ObjectId <<FK>>
  * type : Enum(Email, In-App)
  * subject : String
  * body : String
  * status : Enum(Pending, Sent, Failed)
  errorMessage : String
  retryCount : Number
  sentAt : Date
  createdAt : Date
}

user ||--o| patient : "associates to (if patient user)"
user ||--o{ token : "owns"
patient ||--o{ emr : "has"
user ||--o{ emr : "creates (as Provider)"
user ||--o{ audit : "triggers"
user ||--o{ notify : "receives"
@endum
```

---

## 8. Database Schema Design (MongoDB Collections)

All database models are implemented using **Mongoose** with strict type validations, default values, and appropriate index declarations.

### 8.1 Users Collection (`users`)

| Field | Type | Validation Rules | Description | Index |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Auto-generated | Primary Key | Yes |
| `email` | `String` | Unique, lowercase, trim, regex email format | User login credential | Unique |
| `passwordHash` | `String` | Min length 60 (bcrypt result) | Hashed password | No |
| `firstName` | `String` | Required, trim, max 50 chars | First Name | No |
| `lastName` | `String` | Required, trim, max 50 chars | Last Name | No |
| `role` | `String` | Enum: `['Super Admin', 'Hospital Admin', 'Doctor', 'Nurse', 'Receptionist', 'Lab Technician', 'Pharmacist', 'Billing Executive', 'Patient']` | Role-based authorization value | Yes |
| `isActive` | `Boolean` | Default: `true` | Soft-deletion flag | No |

```javascript
// Mongoose Definition snippet
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  role: { 
    type: String, 
    required: true, 
    enum: ['Super Admin', 'Hospital Admin', 'Doctor', 'Nurse', 'Receptionist', 'Lab Technician', 'Pharmacist', 'Billing Executive', 'Patient'] 
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
```

### 8.2 Patients Collection (`patients`)

| Field | Type | Validation Rules | Description | Index |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Auto-generated | Primary Key | Yes |
| `patientId` | `String` | Unique, regex: `/^PT-\d{8}-\d{4}$/` | Custom hospital identifier | Unique |
| `userId` | `ObjectId` | Reference `users`, nullable | Associated portal account | Yes |
| `firstName` | `String` | Required, trim | Patient's first name | No |
| `lastName` | `String` | Required, trim | Patient's last name | No |
| `dateOfBirth` | `Date` | Required, past date validation | Birthdate | No |
| `gender` | `String` | Enum: `['Male', 'Female', 'Other', 'Prefer not to say']` | Gender specification | No |
| `contactNumber`| `String` | Required, regex for international formats | Phone number | No |
| `bloodGroup` | `String` | Enum: `['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']` | Blood type | No |
| `allergies` | `[String]` | Array of strings | Known patient allergies | No |

### 8.3 EMR Collection (`emrs`)

| Field | Type | Validation Rules | Description | Index |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Auto-generated | Primary Key | Yes |
| `patientId` | `ObjectId` | Reference `patients`, required | Target Patient | Yes (Compound) |
| `providerId` | `ObjectId` | Reference `users`, required | Authoring Doctor/Nurse | Yes |
| `encounterDate`| `Date` | Required, defaults to `Date.now` | Date of patient visit | Yes (Compound) |
| `vitals` | `Object` | Schema validation (bp, heartRate, temperature) | Recorded physiological metrics | No |
| `clinicalNotes`| `String` | Required, min 10 characters | Narrative text of visit | No |
| `diagnoses` | `[Object]` | Schema: `code` (ICD-10), `name`, `status` | ICD-10 Diagnostic codes | No |
| `prescriptions`| `[Object]` | Schema: `drugName`, `dosage`, `frequency`, `duration` | Prescribed medications | No |
| `attachments` | `[Object]` | Schema: `fileName`, `fileUrl`, `fileType`, `uploadedBy` | Secure Cloudinary assets | No |

### 8.4 Refresh Tokens Collection (`refreshtokens`)

| Field | Type | Validation Rules | Description | Index |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Auto-generated | Primary Key | Yes |
| `userId` | `ObjectId` | Reference `users`, required | Owner of token | Yes |
| `token` | `String` | Required, SHA-256 hashed | Unique refresh identifier | Unique |
| `expiresAt` | `Date` | Required | Token expiration date | TTL Index |
| `isRevoked` | `Boolean` | Default: `false` | Revocation status | No |
| `replacedByToken` | `String` | Nullable | Rotation trace token | No |

### 8.5 Audit Logs Collection (`auditlogs`)

| Field | Type | Validation Rules | Description | Index |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Auto-generated | Primary Key | Yes |
| `userId` | `ObjectId` | Reference `users`, required | Performing user | Yes |
| `action` | `String` | Required (e.g., `EMR_UPDATE`, `USER_LOGIN`) | Log action name | Yes |
| `resource` | `String` | Required (e.g., `EMR`, `User`, `Patient`) | Model/Table name | No |
| `resourceId` | `String` | Required | Primary key of target resource | Yes |
| `ipAddress` | `String` | IPv4/IPv6 format validation | Source IP of client | No |
| `userAgent` | `String` | Client browser agent string | Client environment metadata | No |
| `changes` | `Object` | Schema: `before: Object, after: Object` | Field-level differences | No |
| `timestamp` | `Date` | Default: `Date.now` | Event time | Yes (TTL Optional) |

### 8.6 Notifications Collection (`notifications`)

| Field | Type | Validation Rules | Description | Index |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Auto-generated | Primary Key | Yes |
| `recipientId` | `ObjectId` | Reference `users`, required | Recipient | Yes |
| `type` | `String` | Enum: `['Email', 'In-App']`, default: `'Email'` | Channel type | No |
| `subject` | `String` | Required | Subject line | No |
| `body` | `String` | Required | Content body | No |
| `status` | `String` | Enum: `['Pending', 'Sent', 'Failed']` | Delivery status | Yes |
| `retryCount` | `Number` | Default: `0`, max: `3` | Attempts made to send | No |
| `errorMessage`| `String` | Nullable | Reason for dispatch failure | No |

---

## 9. API Design Documentation

The HMS uses a RESTful JSON API format.

### API Standards
1. **API Versioning**: All routes prefixed with `/api/v1/`.
2. **Content-Type**: Always `application/json`.
3. **Response Envelope**: All response JSON objects follow a standard format:
   ```json
   {
     "success": true,
     "message": "Operation description status",
     "data": {}
   }
   ```
4. **Error Envelope**: Error responses contain details of what went wrong:
   ```json
   {
     "success": false,
     "error": {
       "code": "VALIDATION_ERROR",
       "message": "Detailed description of error inputs",
       "details": []
     }
   }
   ```

### Standard HTTP Status Codes
* `200 OK`: Successful read/update.
* `201 Created`: Successful creation.
* `400 Bad Request`: Validation failures, invalid data formats.
* `401 Unauthorized`: Missing or expired access token.
* `403 Forbidden`: Authenticated, but lacking sufficient RBAC permissions.
* `404 Not Found`: Resource does not exist.
* `429 Too Many Requests`: Rate limit threshold exceeded.
* `500 Internal Server Error`: Infrastructure or code crash.

---

## 10. REST API Endpoints

Below is the exhaustive route specification under the purview of Member 1:

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/v1/auth/login` | Public | Authenticate credentials. Returns access token and sets HTTP-only refresh cookie. |
| **POST** | `/api/v1/auth/refresh` | Public | Exchanges active Refresh cookie for a new Access + Refresh token. |
| **POST** | `/api/v1/auth/logout` | All Roles | Revokes active Refresh token and clears cookie. |
| **POST** | `/api/v1/auth/register-staff`| Super Admin, Hospital Admin | Registers a new staff member (Doctors, Nurses, etc.). |
| **POST** | `/api/v1/patients` | Hospital Admin, Receptionist | Intake process to register a new Patient file. |
| **GET** | `/api/v1/patients` | Admin, Receptionist, Doctor, Nurse | List all patient summaries (paginated). |
| **GET** | `/api/v1/patients/:id` | Admin, Rec, Doc, Nurse, Patient (Self) | Retrieve comprehensive patient profile details. |
| **PUT** | `/api/v1/patients/:id` | Admin, Receptionist, Patient (Self) | Update demographics / contact info. |
| **POST** | `/api/v1/emr` | Doctor, Nurse | Create a new encounter record in patient EMR. |
| **GET** | `/api/v1/emr/patient/:patientId`| Admin, Doctor, Nurse, Patient (Self) | Get entire historical EMR ledger of a Patient. |
| **POST** | `/api/v1/emr/:id/attachments`| Doctor, Nurse, Lab Technician | Upload EMR attachments using Multer routing to Cloudinary. |
| **GET** | `/api/v1/audit-logs` | Super Admin, Hospital Admin | View system audit trial (paginated, filterable by user/action). |

---

## 11. Request & Response Examples

### 11.1 POST `/api/v1/auth/login`

**Request Headers**:
```http
Content-Type: application/json
```
**Request Body**:
```json
{
  "email": "doctor.smith@hms.com",
  "password": "Password123!"
}
```

**Response Headers**:
```http
Status: 200 OK
Content-Type: application/json
Set-Cookie: refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Strict; Max-Age=604800
```
**Response Body**:
```json
{
  "success": true,
  "message": "Authentication successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2MGFhYmMyMjNhNTQ4OTAwMTVmMTI3MDAiLCJyb2xlIjoiRG9jdG9yIn0...",
    "user": {
      "id": "60aabc223a54890015f12700",
      "email": "doctor.smith@hms.com",
      "firstName": "John",
      "lastName": "Smith",
      "role": "Doctor"
    }
  }
}
```

### 11.2 POST `/api/v1/patients`

**Request Headers**:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```
**Request Body**:
```json
{
  "firstName": "Alice",
  "lastName": "Brown",
  "dateOfBirth": "1990-05-14",
  "gender": "Female",
  "contactNumber": "+15550199283",
  "emergencyContact": {
    "name": "Robert Brown",
    "relation": "Spouse",
    "phone": "+15550199284"
  },
  "bloodGroup": "O+",
  "allergies": ["Penicillin", "Peanuts"]
}
```

**Response Body**:
```json
{
  "success": true,
  "message": "Patient registration completed successfully",
  "data": {
    "_id": "60aabd443a54890015f12705",
    "patientId": "PT-20260617-8891",
    "firstName": "Alice",
    "lastName": "Brown",
    "dateOfBirth": "1990-05-14T00:00:00.000Z",
    "gender": "Female",
    "contactNumber": "+15550199283",
    "emergencyContact": {
      "name": "Robert Brown",
      "relation": "Spouse",
      "phone": "+15550199284"
    },
    "bloodGroup": "O+",
    "allergies": ["Penicillin", "Peanuts"],
    "createdAt": "2026-06-17T10:00:00.000Z"
  }
}
```

### 11.3 POST `/api/v1/emr`

**Request Headers**:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```
**Request Body**:
```json
{
  "patientId": "60aabd443a54890015f12705",
  "clinicalNotes": "Patient presented with dry cough and mild fever. Prescribed paracetamol.",
  "vitals": {
    "bloodPressure": "120/80",
    "heartRate": 72,
    "temperature": 98.6
  },
  "diagnoses": [
    {
      "code": "J06.9",
      "name": "Acute upper respiratory infection, unspecified",
      "status": "Active"
    }
  ],
  "prescriptions": [
    {
      "drugName": "Paracetamol 500mg",
      "dosage": "1 tablet",
      "frequency": "Three times daily",
      "duration": "5 days"
    }
  ]
}
```

**Response Body**:
```json
{
  "success": true,
  "message": "EMR entry created successfully",
  "data": {
    "_id": "60aabe553a54890015f12710",
    "patientId": "60aabd443a54890015f12705",
    "providerId": "60aabc223a54890015f12700",
    "encounterDate": "2026-06-17T10:02:00.000Z",
    "vitals": {
      "bloodPressure": "120/80",
      "heartRate": 72,
      "temperature": 98.6
    },
    "clinicalNotes": "Patient presented with dry cough and mild fever. Prescribed paracetamol.",
    "diagnoses": [
      {
        "code": "J06.9",
        "name": "Acute upper respiratory infection, unspecified",
        "status": "Active"
      }
    ],
    "prescriptions": [
      {
        "drugName": "Paracetamol 500mg",
        "dosage": "1 tablet",
        "frequency": "Three times daily",
        "duration": "5 days"
      }
    ],
    "attachments": [],
    "createdAt": "2026-06-17T10:02:00.000Z"
  }
}
```

---

## 12. Authentication Flow

The authentication architecture is split into a direct token issuance workflow. The system enforces validation mechanisms before returning active tokens.

1. **Submit Credentials**: The client posts email and password to `/api/v1/auth/login`.
2. **Account Validation**:
   - Check if the user exists and is marked `isActive: true`.
   - Compare password hash with database using `bcrypt.compare()`.
3. **Token Generation**:
   - Generate an **Access Token** containing `userId` and `role` in the payload (signed with `ACCESS_TOKEN_SECRET`, expires in 15 mins).
   - Generate a cryptographically secure, random **Refresh Token**. Hash this value using SHA-256 and save it in the `refreshtokens` collection linked to the `userId`.
4. **Response Delivery**:
   - Set the raw Refresh Token string inside an HTTP-only, secure, SameSite cookie:
     `Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth; Max-Age=604800`
   - Send the Access Token and sanitized user object in the JSON response payload.

---

## 13. JWT + Refresh Token Architecture

To mitigate session hijacking and token theft, the system employs **Refresh Token Rotation (RTR)**.

```
       [ Client ]                        [ API Server ]                    [ MongoDB ]
           |                                   |                                |
           |----- 1. POST /auth/login -------->|                                |
           |                                   |-- 2. Validate Credentials ---->|
           |                                   |<-- 3. Return User Data --------|
           |                                   |-- 4. Save Refresh Token ------>|
           |<---- 5. Set HTTP-only Cookie -----|                                |
           |         & return Access JWT ------|                                |
           |                                   |                                |
           |--- 6. Request with Access JWT --->|                                |
           |       (Submits Expired JWT)       |                                |
           |<-- 7. Returns 401 Expired --------|                                |
           |                                   |                                |
           |----- 8. POST /auth/refresh ------>|                                |
           |       (Sends Cookie automatically)|-- 9. Check Hashed Token ------>|
           |                                   |   * Match found, not revoked   |
           |                                   |-- 10. Rotate & Revoke Old ----->|
           |                                   |   * Save New Token             |
           |<---- 11. Set New Cookie ----------|                                |
           |          & return New Access JWT -|                                |
```

### Rotation and Replay Attack Protection
1. When `/api/v1/auth/refresh` is hit:
   - Read the refresh cookie.
   - Hash it and look it up in the database.
   - If the database indicates the token **is revoked**, this signals a replay attack (an attacker has stolen a previously used refresh token). 
   - **Action**: Immediately delete all refresh tokens belonging to the owner `userId` to terminate all active sessions. Throw a `403 Forbidden` error and trigger a priority threat alert.
   - If valid: Create a new refresh token, record the old token's `replacedByToken` with the new token id, flag the old token as `isRevoked: true`, save the new hashed token, and set the cookie. Return a new access token.
2. **TTL Indexing**: Refresh tokens automatically self-delete from the database after 7 days using MongoDB TTL indexing on the `expiresAt` field.

---

## 14. RBAC Design for all 9 Roles

The system maps capabilities to the 9 default roles. The RBAC model defines permission profiles at the controller level:

| Feature / Action | Super Admin | Hosp. Admin | Doctor | Nurse | Rec. | Lab Tech | Pharm. | Billing | Patient |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Manage Staff Accounts | **X** | **X** | | | | | | | |
| View Audit Logs | **X** | **X** | | | | | | | |
| Register Patient | | **X** | | | **X** | | | | |
| Edit Patient Demographics | | **X** | | | **X** | | | | **X** (Self) |
| Read Patient Demographics | **X** | **X** | **X** | **X** | **X** | **X** | **X** | **X** | **X** (Self) |
| Create EMR Chart Notes | | | **X** | **X** | | | | | |
| Add EMR Attachments | | | **X** | | | **X** | | | |
| Read Clinical EMR Notes | | | **X** | **X** | | | **X** | | **X** (Self) |
| Generate Invoice Billing | | | | | | | | **X** | |

*Note: Access to EMR content for Patient (Self) only retrieves records linked to their specific logged-in account (validated matching `patientId`).*

---

## 15. Middleware Architecture

Express middlewares filter and intercept all requests. The diagram below represents the request-response cycle:

```
[Incoming Request] 
       |
  [Rate Limiter] -------------------> (If Exceeded: 429 Too Many Requests)
       |
  [Helmet / CORS Headers]
       |
  [Authenticate JWT] ---------------> (If Expired/Missing: 401 Unauthorized)
       |
  [RBAC Guard] ---------------------> (If Role Mismatch: 403 Forbidden)
       |
  [Request Body Validator (Joi)] ----> (If Invalid: 400 Bad Request)
       |
  [Controller Action] 
       |
  [Audit Logging Middleware]
       |
  [Global Error Handler] -----------> (If Uncaught Exception: 500 Internal Error)
```

### Core Implementations

#### Authentication Middleware (`authenticateJWT.js`)
Decodes the HTTP header `Authorization: Bearer <token>`. Attaches user payload to `req.user` if valid.

#### RBAC Middleware (`authorizeRoles.js`)
Takes an array of allowed roles and asserts role validity:
```javascript
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN_ACCESS', message: 'Access denied: insufficient permissions' }
      });
    }
    next();
  };
};
```

---

## 16. Validation Rules

All endpoints validating inputs enforce structured constraints via **Joi**. 

### 16.1 Patient Registration Schema
```javascript
import Joi from 'joi';

export const patientRegistrationSchema = Joi.object({
  firstName: Joi.string().trim().max(50).required(),
  lastName: Joi.string().trim().max(50).required(),
  dateOfBirth: Joi.date().less('now').required(),
  gender: Joi.string().valid('Male', 'Female', 'Other', 'Prefer not to say').required(),
  contactNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required()
    .message('Contact number must be in valid E.164 international format'),
  emergencyContact: Joi.object({
    name: Joi.string().trim().required(),
    relation: Joi.string().trim().required(),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required()
  }).required(),
  bloodGroup: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').optional(),
  allergies: Joi.array().items(Joi.string().trim()).optional()
});
```

### 16.2 EMR Entry Schema
```javascript
export const emrEntrySchema = Joi.object({
  patientId: Joi.string().hex().length(24).required(),
  clinicalNotes: Joi.string().min(10).required(),
  vitals: Joi.object({
    bloodPressure: Joi.string().pattern(/^\d{2,3}\/\d{2,3}$/).required()
      .message('Blood pressure must follow format SBP/DBP (e.g. 120/80)'),
    heartRate: Joi.number().integer().min(30).max(250).required(),
    temperature: Joi.number().precision(1).min(90.0).max(110.0).required()
  }).required(),
  diagnoses: Joi.array().items(Joi.object({
    code: Joi.string().pattern(/^[A-Z][0-9][0-9A-Z](\.[0-9A-Z]{1,4})?$/).required()
      .message('Diagnosis code must be valid ICD-10 formatting'),
    name: Joi.string().required(),
    status: Joi.string().valid('Active', 'Resolved', 'Suspected').required()
  })).required(),
  prescriptions: Joi.array().items(Joi.object({
    drugName: Joi.string().required(),
    dosage: Joi.string().required(),
    frequency: Joi.string().required(),
    duration: Joi.string().required()
  })).optional()
});
```

---

## 17. Security Architecture

HMS implements a defense-in-depth framework:

1. **Password Hashing**: Done via `bcrypt` during registration. Salts are generated with 12 calculation rounds to prevent GPU-based brute-force matching.
2. **CORS Configuration**: Restricts origin requests strictly to Whitelisted Client domains, blocking credentials-sharing across unauthorized portals:
   ```javascript
   const corsOptions = {
     origin: process.env.ALLOWED_CLIENT_ORIGIN,
     credentials: true,
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
   };
   ```
3. **Helmet Integration**: Implements security response headers, preventing clickjacking (X-Frame-Options), enforcing HSTS, and blocking MIME-type sniffing.
4. **Rate Limiting**: Enforced on `/api/v1/auth/login` to prevent credential stuffing:
   ```javascript
   import rateLimit from 'express-rate-limit';
   export const authRateLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 5, // Limit each IP to 5 requests per window
     message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' }
   });
   ```

---

## 18. Audit Log Architecture

For absolute compliance with HIPAA protocols, the system creates immutable audit files.

1. **System Pipeline**:
   - The Audit Service runs asynchronously.
   - Operations log detailed state transitions.
   - Audit logs are database-backed and cannot be updated (`PUT` / `PATCH` routes to `auditlogs` are omitted).
2. **MongoDB Indexing Policy**:
   - Compounded indices: `db.auditlogs.createIndex({ resource: 1, resourceId: 1 })`
   - Target identification indices: `db.auditlogs.createIndex({ userId: 1, timestamp: -1 })`

```javascript
// Audit logger helper snippet
export const logAuditEvent = async ({ userId, action, resource, resourceId, ipAddress, userAgent, changes }) => {
  try {
    await AuditLog.create({
      userId,
      action,
      resource,
      resourceId,
      ipAddress,
      userAgent,
      changes
    });
  } catch (err) {
    winston.error(`Failed to write audit log event: ${err.message}`);
  }
};
```

---

## 19. Notification Architecture

The system utilizes an asynchronous event emitter mapping to NodeMailer for template parsing.

```
 [Application Event] 
        |
   (Dispatches)
        v
 [Notification Service] ----> [Fetch HTML Template]
        |
        |---> [Inject Template Context]
        v
 [Nodemailer Transport (SMTP)]
        |
   (Attempt Send)
        |
        +---> [Success] ---> Update Database status to 'Sent'
        |
        +---> [Failure] ---> Increment retryCount. 
                             If retryCount < Max: Push to Retry Queue.
                             Else: Update status to 'Failed' + log trace.
```

### 19.1 Configurations
* **Transport Driver**: SMTP via TLS (`port 465` or `587`).
* **Connection Pooling**: Reuses SMTP server connections to handle bursts of notifications.
* **HTML Templates**: Located inside `/templates` folder (e.g. `prescription-release.html`). Injected with variables like `{{patientName}}`, `{{providerName}}`.

---

## 20. EMR File Storage Design

EMR clinical record attachments are securely uploaded using **Multer** and saved to **Cloudinary**.

1. **Pipeline**:
   - Client sends `multipart/form-data` request with the attachment file.
   - Multer interceptor parses the stream directly into a memory buffer.
   - Files are validated against size restrictions (Max 10MB) and MIME types (`application/pdf`, `image/jpeg`, `image/png`).
   - The stream is piped directly to Cloudinary API using the cloud provider's SDK.
   - The file is saved in Cloudinary under a dedicated folder path named `hms_emr_attachments/`.
   - Cloudinary returns the secure HTTPS URL and metadata.
   - This URL, file name, and file type are appended to the patient's EMR record.

2. **Access Security**:
   - All uploaded medical documents are flagged as private assets.
   - Access to raw files is restricted by generating **signed URLs** with a short time-to-live (TTL = 15 minutes) when retrieved by authorized users.

---

## 21. Folder Structure

The backend directory follows clean architecture principles, separating concerns by layers:

```
hms-backend/
├── config/
│   ├── db.js                 # MongoDB connection pool setup
│   ├── cloudinary.js         # Cloudinary SDK client configuration
│   └── logger.js             # Winston logger setup
├── controllers/
│   ├── authController.js     # User registration, login, logout, refresh
│   ├── patientController.js  # Patient profile crud actions
│   └── emrController.js      # EMR encounters, updates, file attachments
├── middlewares/
│   ├── authenticateJWT.js    # JWT authorization validator
│   ├── authorizeRoles.js     # RBAC controller-level filter
│   ├── errorHandler.js       # Global Express centralized error formatter
│   └── requestValidator.js   # Joi payload validation injector
├── models/
│   ├── User.js               # Mongoose schema for User
│   ├── Patient.js            # Mongoose schema for Patient
│   ├── EMR.js                # Mongoose schema for Electronic Medical Record
│   ├── RefreshToken.js       # Mongoose schema for refresh sessions
│   ├── AuditLog.js           # Mongoose schema for audit compliance
│   └── Notification.js       # Mongoose schema for messages
├── routes/
│   ├── authRoutes.js         # Auth routing
│   ├── patientRoutes.js      # Patient routing
│   └── emrRoutes.js          # EMR routing
├── services/
│   ├── auditService.js       # Service mapping database audits
│   ├── notificationService.js# Service managing mail dispatches via Nodemailer
│   └── storageService.js     # Cloudinary helper uploads and signing URLs
├── templates/
│   ├── registrationEmail.html# HTML email template for registration
│   └── reportReady.html      # HTML email template for diagnostic results
├── tests/
│   ├── unit/                 # Auth, Patient & EMR business units tests
│   └── integration/          # API route endpoint checks (Supertest)
├── .env.example              # Template for environment configurations
├── app.js                    # Express App definition
└── server.js                 # Server listener bootstrap
```

---

## 22. Sequence Diagrams

### 22.1 Authentication (JWT + RTR Flow)

```plantuml
@startuml
autonumber
actor Client
boundary Router
control AuthController
entity RefreshTokenModel
database MongoDB

Client -> Router: POST /api/v1/auth/refresh (includes Cookie)
Router -> AuthController: handleTokenRefresh(req)
AuthController -> MongoDB: Find RefreshToken by incoming value
MongoDB --> AuthController: Return RefreshToken document

alt Token Not Found or Revoked (Attack Detection)
    AuthController -> MongoDB: Revoke ALL tokens under userId
    AuthController --> Client: HTTP 403 Forbidden (Alert logged)
else Token Valid
    AuthController -> AuthController: Generate New Access JWT
    AuthController -> AuthController: Generate New Refresh Token
    AuthController -> RefreshTokenModel: Mark Old Token as Revoked (set replacedByToken)
    AuthController -> RefreshTokenModel: Create New Hashed Refresh Token
    RefreshTokenModel -> MongoDB: Save transactions
    AuthController --> Client: HTTP 200 OK (New Access Token in JSON + Cookie Set)
end
@endum
```

### 22.2 EMR Attachment Upload Flow

```plantuml
@startuml
autonumber
actor "Lab Technician" as User
boundary Router
control EMRController
entity StorageService
control CloudinaryAPI
database MongoDB

User -> Router: POST /api/v1/emr/:id/attachments (multipart/form-data)
Router -> Router: authenticateJWT & authorizeRoles(['Lab Technician', 'Doctor', 'Nurse'])
Router -> Router: Multer file parsing & memory buffering validation
Router -> EMRController: uploadAttachment(req)
EMRController -> StorageService: uploadToCloudinary(fileBuffer)
StorageService -> CloudinaryAPI: Pipe stream to folder "hms_emr_attachments/"
CloudinaryAPI --> StorageService: Return secure URL & public_id
StorageService --> EMRController: Return upload response
EMRController -> MongoDB: Find EMR & push attachment details (URL, metadata)
MongoDB --> EMRController: Document updated
EMRController -> User: HTTP 201 Created (Updated EMR payload)
@endum
```

---

## 23. Activity Diagrams

### 23.1 Patient Intake Process (Receptionist)

```plantuml
@startuml
start
:Receptionist enters patient details;
:Submit registration payload;
if (Validate fields (Joi Schema)?) then (No)
  :Return 400 Bad Request;
  stop
else (Yes)
  :Generate unique Patient ID (PT-YYYYMMDD-XXXX);
  :Check if Email/Mobile already exists;
  if (Record Exists?) then (Yes)
    :Return 409 Conflict;
    stop
  else (No)
    :Insert Patient details in MongoDB;
    :Dispatch Account Creation email notification;
    :Log "PATIENT_REGISTRATION" Audit Event;
    :Return 201 Created;
    stop
  endif
endif
@endum
```

### 23.2 EMR Record Update Process (Doctor/Nurse)

```plantuml
@startuml
start
:Doctor/Nurse updates Patient EMR;
:Submit EMR update payload;
if (Verify Role: 'Doctor' or 'Nurse'?) then (No)
  :Return 403 Forbidden;
  stop
else (Yes)
  :Fetch Patient record;
  if (Patient Exists?) then (No)
    :Return 404 Not Found;
    stop
  else (Yes)
    :Validate Clinical payload (vitals, ICD-10);
    if (Validation Successful?) then (No)
      :Return 400 Bad Request;
      stop
    else (Yes)
      :Insert EMR Entry;
      :Log "EMR_CREATION" Audit Event;
      :Emit Patient Alert Notification Event;
      :Return 201 Created;
      stop
    endif
  endif
endif
@endum
```

---

## 24. Error Handling Strategy

Centralized error orchestration avoids information leakages while keeping debug tracking simple.

1. **Centralized Error Middleware (`errorHandler.js`)**:
   - Catches all bubbles from async controllers (via Express async handlers wrapper).
   - Distinguishes between Operational errors (e.g., validations, permissions) and Programming errors (e.g., database connection failure).
2. **Custom Error Classes**:
   - `AppError` base class extending native `Error` adding `statusCode` and operational flags.
   - `ValidationError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`.

```javascript
// AppError definition
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
```

3. **Response Redaction**:
   - Under `production` builds, the stack trace is removed from response JSONs, logging the raw error trace to the server logs.

---

## 25. Logging Strategy

Structured application logs are captured using **Winston**.

* **Log Formats**: JSON formats for production parsing, and colorized text layouts during development.
* **Transports**:
  * **Console Transport**: Outputs warnings and errors.
  * **File Transport (`combined.log`)**: Captures complete system logs.
  * **File Transport (`error.log`)**: Captures logs of level `error` only.

```javascript
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});
```

---

## 26. Scalability Considerations

1. **Database Indexing Strategy**:
   - Enforce indexes on frequent filters: `User.email` (Unique), `Patient.patientId` (Unique).
   - Compound index on `EMR`: `{ patientId: 1, encounterDate: -1 }`.
   - Index on `AuditLog`: `{ userId: 1, timestamp: -1 }`.
2. **Database Connection Pooling**:
   - Configure pool sizes inside Mongoose options: `maxPoolSize: 50`.
3. **Stateless Middleware Layer**:
   - The API layer stores no state (tokens are validated cryptographically). This enables horizontal scaling across multiple instances (e.g., in AWS ECS or Kubernetes) using a round-robin load balancer.
4. **Caching Layer**:
   - Integrate Redis for frequently queried metadata (e.g., list of clinics, billing codes, or staff roles) to avoid DB roundtrips.

---

## 27. Deployment Architecture

```
[ DNS (Route 53) ]
       |
       v
[ Load Balancer (AWS ALB) ]
       |
       v (TLS Termination)
[ Node.js Express App Cluster (AWS ECS Fargate) ]
       |
       +----> (Write/Read Logs) -------> [ CloudWatch ]
       |
       +----> (Private Attachments) ---> [ Cloudinary (Private Folder) ]
       |
       +----> (Relational Session Check) [ Redis Cache ]
       |
       +----> (Persistent Data Store) -> [ MongoDB Atlas (3-Node Replica Set) ]
```

### Infrastructure Configuration Details
* **Runtime**: Node.js 20 LTS.
* **Database**: MongoDB Atlas Cluster tier M10+ for replica distribution and automatic automated backups.
* **SSL/TLS**: Mandatory TLS 1.3 encryption on load balancers and Atlas database connections.
* **Environment Configuration**: Set using secret managers (AWS Secrets Manager or dotenv configurations on runtime environment variables).

---

## 28. Testing Strategy

The backend enforces a testing strategy:
* **Unit Tests**: Focus on isolating individual utility helper functions, encryption modules, JWT signing, and route authorization guards.
* **Integration Tests**: Focus on the API request-response cycle, including database connections, validation middleware execution, controller business logic, and error handling.
* **Goal**: Achieve a minimum of **85% code coverage** for Auth, Patient, and EMR services.

---

## 29. Unit Testing Plan

* **Framework**: Jest.
* **Mocking**: Mock external dependencies like Winston logger, Cloudinary client, and Nodemailer SMTP driver.

```javascript
// Example Jest Unit Test for JWT verification middleware
import jwt from 'jsonwebtoken';
import { authenticateJWT } from '../middlewares/authenticateJWT.js';

describe('Unit Test: authenticateJWT Middleware', () => {
  let mockRequest;
  let mockResponse;
  let nextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    nextFunction = jest.fn();
  });

  test('should return 401 if Authorization header is missing', () => {
    mockRequest.headers = {};
    authenticateJWT(mockRequest, mockResponse, nextFunction);
    expect(mockResponse.status).toHaveBeenCalledWith(401);
  });

  test('should call next() if valid token is provided', () => {
    const payload = { userId: '12345', role: 'Doctor' };
    const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET || 'secret');
    mockRequest.headers = { authorization: `Bearer ${token}` };
    
    authenticateJWT(mockRequest, mockResponse, nextFunction);
    expect(nextFunction).toHaveBeenCalled();
    expect(mockRequest.user.userId).toEqual('12345');
  });
});
```

---

## 30. Integration Testing Plan

* **Framework**: Jest + Supertest.
* **Database**: Run integration tests using an in-memory MongoDB server (`mongodb-memory-server`) to ensure isolation from production and staging databases.

### Integration Test Steps:
1. Spin up an in-memory MongoDB instance.
2. Initialize Express app and connect to the mock database.
3. Run migrations and seed roles.
4. Execute HTTP API test suites sequentially:
   - Auth endpoints (Login, rotation checks).
   - RBAC rules validation (Attempt unauthorized updates).
   - Patient intake and EMR updates.
5. Tear down the database connection after completing all tests.

---

## 31. Sprint Breakdown

The initial development phase is split into four 2-week sprints:

```mermaid
gantt
    title HMS Backend & Infrastructure Lead (Member 1) - Sprint Schedule
    dateFormat  YYYY-MM-DD
    section Sprint 1: DB & Auth Foundation
    Setup MongoDB & Core Schemas          :active, a1, 2026-06-18, 5d
    Implement JWT & Refresh Token RTR    :active, a2, after a1, 5d
    Setup Winston Logger & CORS/Helmet   :active, a3, after a2, 4d
    section Sprint 2: Core RBAC & Patients
    Implement authorizeRoles Middleware  :b1, 2026-07-02, 4d
    Patient Demographics & Intake CRUD   :b2, after b1, 6d
    Joi Input Validation Schemas         :b3, after b2, 4d
    section Sprint 3: EMR & Storage
    EMR Schema & Clinical Notes API      :c1, 2026-07-16, 5d
    Multer + Cloudinary attachment upload:c2, after c1, 5d
    Secure Private signed Cloudinary URL :c3, after c2, 4d
    section Sprint 4: Auditing & Notifications
    Audit Log Service Integration        :d1, 2026-07-30, 4d
    Nodemailer Service Setup             :d2, after d1, 5d
    Unit & Integration Test Suite (85%)  :d3, after d2, 5d
```

---

## 32. Deliverables Checklist

### Definition of Done (DoD)
- [ ] Code compiles without errors.
- [ ] All Joi schemas are integrated and validating API payloads.
- [ ] API routes match the standard JSON response format.
- [ ] All security requirements (CORS, Helmet, Rate limiting) are configured.
- [ ] Unit and Integration test coverage is at least 85%.
- [ ] Mongoose query profiling verified with correct indexing.
- [ ] Linting and formatting checked using ESLint and Prettier.

### Final Checklist for Handover
- [ ] MongoDB Atlas Connection URI configured.
- [ ] Cloudinary environment credentials setup.
- [ ] SMTP service configs verified.
- [ ] JWT and Refresh Token secrets added to `.env`.
- [ ] API documentation verified.

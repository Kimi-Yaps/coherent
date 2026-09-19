# Coherent — Mental Wellbeing & Clinical Recovery Platform

A mental health, peer support, and relapse prevention web application built with **React**, **TypeScript**, **Vite**, and **Firebase (Auth & Cloud Firestore)**.

---

## 🌟 Application Overview & Features

- **🏠 Home (`/`)**: Daily wellness overview, quick check-in, and instant care navigation.
- **🌱 AI Support (`/ai-support`)**: 24/7 empathetic care companion with multi-session history (*Daily Mindfulness*, *Sleep & Relaxation*).
- **💬 Counselor & Peer Chats (`/chats`)**: Real-time 1-on-1 messaging with certified counselors and peer listeners.
- **🗓️ Bookings & Calendar (`/bookings`)**: Schedule sessions, view calendar appointments, and reschedule existing sessions.
- **⚙️ Clinical Relapse Portal (`/admin`)**: Confidential dashboard for clinicians to monitor patient risk scores (0–100), review flagged transcripts, manage the AI Watchlist, and coordinate intervention protocols.

---

## 🔐 Authentication & Sign In / Sign Up (`/auth`)

Users can register new accounts, sign in, or test immediately with pre-configured role profiles.

- **URL**: [`/auth`](https://coherent-d63a8.web.app/auth)
- **Account Types (Roles)**:
  - **🌱 Client / Member (`patient`)**: Access to personal daily support, AI companion, peer chats, and appointments.
  - **🩺 Counselor / Peer (`counselor`)**: Peer listening, managing consultation slots, and patient dialogue.
  - **⚙️ Clinical Desk (`clinician_admin`)**: Restricted clinical administrative portal access.

### Quick Demo Accounts (One-Click Testing)
On the [`/auth`](https://coherent-d63a8.web.app/auth) screen, you can click any instant demo profile:
1. **Patient**: Iman Hakimi (`ImanHakimi@gmail.com`)
2. **Counselor**: Dr. Amelia Chen (`amelia.chen@coherent.care`)
3. **Clinical Admin**: Clinical Relapse Coordinator (`clinical-desk@coherent.care`)

---

## 🔒 Special URL for Admin (`/admin-portal`)

To protect sensitive patient recovery data and relapse intervention protocols, **the Admin portal is strictly hidden from regular users**:

1. **Hidden Navigation**: Non-admin users (clients, counselors, guests) will **never see the "Admin" link** in either the desktop navbar or mobile drawer menu.
2. **Role Guard (`ProtectedRoute`)**: If an unauthorized user attempts to open `/admin` directly, they are automatically intercepted and redirected to the **Admin Gateway**.
3. **Desktop Screen Requirement**: The Clinical Relapse Portal requires a computer screen (>860px) to safely review multi-column clinical transcripts and risk factors.

### Accessing the Special Admin Gateway

- **Special Gateway URL**: [`/admin-portal`](https://coherent-d63a8.web.app/admin-portal)
- **Clinical Access Passkey**: `COHERENT-CLINICAL-2026` *(or `admin2026`)*
- **Clinician Login**: Sign in with registered `clinician_admin` credentials, or click **"⚡ Enter as Clinical Admin (One-Click)"**.

Once authenticated, the user role elevates to `clinician_admin`, unlocking the `/admin` navigation link and clinical tools.

---

## 🗄️ Database Architecture (Cloud Firestore)

The application connects to **Google Cloud Firestore** (project `coherent-d63a8`) with structured NoSQL collections:

| Collection (Table) | Purpose |
| :--- | :--- |
| **`counselors`** | Directory of verified counselors, psychologists, and peer specialists. |
| **`watchlist`** | Clinical relapse detection triggers (sleep debt, cravings, avoidance) managed by clinicians. |
| **`users`** | Registered user records and RBAC role assignments (`patient`, `counselor`, `clinician_admin`). |
| **`bookings`** | Consultation appointments and rescheduling state tracking. |
| **`ai_sessions`** | AI companion session threads and messages. |
| **`chats`** | Real-time 1-on-1 private messaging channels and messages. |
| **`clinical_flags`** | Relapse risk evaluations, severity flags, and clinical notes for patient care. |
| **`notifications`** | In-app alerts delivered to the top navigation bell dropdown. |

### Security Rules & Indexes
- [`firestore.rules`](firestore.rules): Production-level security enforcing ownership and role isolation.
- [`firestore.indexes.json`](firestore.indexes.json): Query optimizations for timestamps and booking timelines.

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- Node.js 18+ (tested on Node.js 24)
- npm

### 2. Environment Configuration
Create a `.env` file in the project root:

```bash
VITE_FIREBASE_API_KEY="your-api-key-here"
VITE_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789012"
VITE_FIREBASE_APP_ID="1:123456789012:web:abcdef123456"
```

### 3. Install & Seed Database
```powershell
# Install dependencies
npm install

# Seed Firestore collections with initial counselors, watchlist, and sample data
npm run db:seed
```

### 4. Run Development Server
```powershell
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## ☁️ Deployment

The application is configured for **Firebase Hosting** with single-page app (SPA) routing:

```powershell
# 1. Type check and build production bundle
npm run build

# 2. Deploy hosting
npx firebase-tools deploy --only hosting

# 3. (Optional) Deploy updated Firestore security rules
npx firebase-tools deploy --only firestore
```

- **Live Production URL**: [https://coherent-d63a8.web.app](https://coherent-d63a8.web.app)
- **Firebase Project Console**: [https://console.firebase.google.com/project/coherent-d63a8/overview](https://console.firebase.google.com/project/coherent-d63a8/overview)

# Coherent — System Architecture, Data Flow & Storage Specifications

This document outlines the technical architecture, data flows, database schemas, and protocol specifications for all user interfaces across the **Coherent** mental health and clinical recovery platform.

---

## 1. High-Level Architecture & Component Map

The following diagram illustrates the relationship between the client-side user interfaces, API Gateway, real-time messaging services, AI pipelines, scheduling engine, and storage tiers:

```mermaid
flowchart TD
    subgraph Client ["Frontend Client (React + Vite)"]
        UI_Nav["NavBar & Notification Center<br/>(Bell, Alerts, Badges)"]
        UI_Auth["Sign Up / Auth Modal & Profile<br/>(/profile)"]
        UI_AI["AI Support Companion<br/>(/ai-support)"]
        UI_Book["Booking, Calendar & Reschedule<br/>(/bookings)"]
        UI_Admin["Admin & Clinical Relapse Portal<br/>(/admin)"]
    end

    subgraph Gateway ["API Gateway & Reverse Proxy"]
        AG["API Gateway / Auth Middleware<br/>(JWT Verification, Role Guard, Rate Limiting)"]
    end

    subgraph Services ["Backend Microservices"]
        AuthSvc["Auth & Identity Service"]
        AISvc["AI Care Companion Engine<br/>(LangChain / Gemini API)"]
        WatchlistEngine["Clinical Relapse & Safety Guard<br/>(Pattern Matcher & Evaluator)"]
        BookingSvc["Booking & Scheduling Engine"]
        NotifSvc["Notification Dispatcher"]
    end

    subgraph DataStore ["Data & Cache Layer"]
        DB_SQL[("Relational Database (PostgreSQL)<br/>Users, Roles, Bookings, Transcripts")]
        DB_Redis[("In-Memory Store (Redis)<br/>Pub/Sub, Sessions, Online Status")]
        DB_Vector[("Vector Database / History Store<br/>Semantic Memory & Session Embeddings")]
    end

    %% UI Connections
    UI_Auth -->|REST / HTTPS| AG
    UI_Book -->|REST / HTTPS| AG
    UI_Admin -->|REST / HTTPS| AG
    UI_Nav -->|REST / Polling or SSE| AG
    UI_AI -->|REST / SSE Streaming| AG

    %% Gateway Routing
    AG -->|Auth & Token Check| AuthSvc
    AG -->|Appointments & Slots| BookingSvc
    AG -->|Admin & Transcripts| WatchlistEngine
    AG -->|AI Inference Request| AISvc

    %% Service to Service & Storage
    AuthSvc --> DB_SQL
    
    AISvc -->|Fetch History & RAG| DB_Vector
    AISvc -->|Screen Against Triggers| WatchlistEngine
    AISvc -->|Persist Session & Messages| DB_SQL
    WatchlistEngine -->|Flag Alert Severity| DB_SQL
    WatchlistEngine -->|Urgent Desk Alert| NotifSvc

    BookingSvc -->|ACID Booking TX| DB_SQL
    BookingSvc -->|Booked Event| NotifSvc
    NotifSvc --> UI_Nav
```

---

## 2. User Sign-Up, Authentication & Role-Based Access Control (RBAC)

### 2.1 Role Permission Matrix

| Role | Accessible UI Views | Key Capabilities & Permissions |
| :--- | :--- | :--- |
| **Patient / User** | `/`, `/ai-support`, `/bookings`, `/profile` | Interacts with 24/7 AI care companion, books and reschedules appointments, manages personal profile. **Blocked from `/admin`**. |
| **Peer / Counselor** | `/`, `/bookings` (as listener), `/profile` | Manages consultation availability, scheduled appointments, and session notes. |
| **Clinical Admin** | `/admin`, `/profile` (Desktop only) | Full access to Relapse Monitoring Calendar, Upcoming Session Table, Patient Risk Scoring (0–100), AI Trigger Watchlist CRUD, and Live Flagged Transcripts. |

### 2.2 Sign-Up & Role Verification Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User as Client / User
    participant Nav as UI (NavBar / Auth Modal)
    participant AG as API Gateway (Role Guard)
    participant Auth as Auth Service
    participant DB as PostgreSQL Database

    Note over User, DB: User Registration (Sign-Up)
    User->>Nav: Enters Name, Username, Email, Password, Selected Role (Patient/Counselor)
    Nav->>Auth: POST /api/v1/auth/signup
    Auth->>Auth: Validate inputs, hash password (Argon2id/bcrypt)
    Auth->>DB: INSERT INTO users & user_roles
    DB-->>Auth: User Record Created (id, role: 'patient', created_at)
    Auth->>Auth: Generate JWT Access Token (claims: {uid, role, exp}) & Refresh Token
    Auth-->>Nav: 201 Created (Token + User Profile)
    Nav->>Nav: Store JWT in secure HttpOnly Cookie / Memory & hydrate state

    Note over User, DB: Accessing Protected Routes (e.g. /admin)
    User->>Nav: Clicks "/admin"
    Nav->>AG: Request route validation with Authorization: Bearer <JWT>
    AG->>AG: Verify signature & inspect claims.role
    alt role == 'clinician_admin' AND Client is Desktop (>860px)
        AG-->>Nav: 200 OK (Allow route navigation)
        Nav->>User: Renders Admin Portal (Timeline, Watchlist, Transcripts)
    else role != 'clinician_admin'
        AG-->>Nav: 403 Forbidden
        Nav->>User: Show Unauthorized Modal or Redirect to Home
    else Screen width <= 860px (Mobile Device)
        Nav->>User: Open "Access Through Computer" Modal (NavBar requirement)
    end
```

---

## 4. AI Companion Chat & History Storage with Clinical Safeguards (`/ai-support`)

The AI Support system (`AISupport.tsx`) provides 24/7 care support across multiple isolated chat sessions (e.g., *Daily Mindfulness & Stress*, *Sleep & Relaxation Routine*). In parallel with generating empathetic responses, it evaluates client messages against active clinical relapse watchlist triggers defined in `/admin`.

### 4.1 AI Data Flow, Vector Memory & Watchlist Interception

```mermaid
sequenceDiagram
    autonumber
    actor Patient as Patient (User)
    participant AIUI as AISupport.tsx (UI)
    participant AISvc as AI Care Orchestrator
    participant Watchlist as Watchlist Trigger Engine
    participant LLM as Gemini / LLM Companion Model
    participant Memory as Semantic History (Vector / Cache)
    participant DB as PostgreSQL (Transcripts & Flags)
    actor Clinician as Clinician Care Desk

    Patient->>AIUI: Clicks "+ New Chat" or selects existing session (e.g., 'chat1')
    AIUI->>DB: Fetch session history for activeChatId
    DB-->>AIUI: Returns chat turns [{ id, sender: 'user'|'assistant', text, time }]
    
    Patient->>AIUI: Enters message: "A single drink tonight would turn my brain off so I can sleep"
    AIUI->>AISvc: POST /api/v1/ai/message { sessionId: 'chat1', message: "..." }
    
    Note over AISvc, Watchlist: Clinical Risk Interception
    AISvc->>Watchlist: Scan input against active watchlist triggers (Verbal cues, behavioral signs)
    Watchlist->>Watchlist: Pattern match: "single drink", "turn my brain off", "sleep"
    Watchlist-->>AISvc: MATCH: wl-2 ("Rationalizing Substance Intake", Severity: HIGH)
    
    AISvc->>DB: INSERT INTO clinical_flags (session_id, patient_id, severity, flag_text, score)
    AISvc->>Clinician: Emit WebSocket priority alert to Admin Desk (Severity: CRITICAL)
    
    Note over AISvc, LLM: Context Augmentation & Empathetic Response
    AISvc->>Memory: Retrieve past session summary & grounding coping mechanisms
    Memory-->>AISvc: Relevant patient profile (e.g., Day 42, Dr. Jenkins assigned)
    AISvc->>LLM: Generate empathetic de-escalation response with grounded persona prompt
    LLM-->>AISvc: "That thought of 'turning off your brain' is the addiction voice... Let us connect you with Dr. Jenkins."
    
    AISvc->>DB: INSERT INTO ai_messages (session_id, sender, text, flag_status)
    AISvc-->>AIUI: Stream reply & update active session preview and date
    AIUI->>Patient: Display message bubble with empathetic response
```

---

## 5. Appointment Booking, Calendar & Rescheduling (`/bookings`)

The booking interface allows patients to select listeners, pick available dates and times, inspect confirmed sessions in a calendar view, and reschedule existing sessions.

### 5.1 Booking & Rescheduling State Flow

```mermaid
stateDiagram-v2
    [*] --> Idle: User navigates to /bookings
    
    state "Booking New Session (tab=booking)" as BookingTab {
        Idle --> SelectListener: Choose Counselor (Amelia Chen, Rafael Ortiz, Nadia Rahman)
        SelectListener --> SelectDate: Pick Date (Mon 14, Tue 15...)
        SelectDate --> SelectSlot: Pick Available Slot (09:00, 10:30, 13:00...)
        SelectSlot --> SubmitBooking: Click "Book Appointment"
    }
    
    SubmitBooking --> ValidationTx: POST /api/v1/bookings
    
    state ValidationTx <<choice>>
    ValidationTx --> Confirmed: Slot Available (Lock Acquired)
    ValidationTx --> Conflict: Slot Already Booked (409 Conflict)
    
    Conflict --> SelectSlot: Display Error & Refresh Slots
    
    Confirmed --> CreateNotification: Push to Notifications Table
    CreateNotification --> ScheduledState: Status = 'Confirmed'
    
    state "Reschedule Session (tab=reschedule)" as RescheduleTab {
        ScheduledState --> SelectExisting: Choose existing session (e.g. 14 Sep · 10:30)
        SelectExisting --> PickNewSlot: Choose new time slot (e.g. Mon 21 · 11:00)
        PickNewSlot --> ConfirmMove: Click "Move Session"
    }
    
    ConfirmMove --> UpdateBookingTx: PUT /api/v1/bookings/:id/reschedule
    UpdateBookingTx --> ScheduledState: Status = 'Rescheduled'
    ScheduledState --> CompletedState: Appointment Held
    CompletedState --> [*]
```

### 5.2 Slot Reservation & Notification Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User as Patient
    participant UI as Bookings.tsx
    participant Svc as Booking Service
    participant DB as PostgreSQL
    participant Notif as Notification Service
    participant Nav as NavBar Notification Bell

    User->>UI: Selects 'Amelia Chen', 'Mon 14', '10:30', clicks "Book Appointment"
    UI->>Svc: POST /api/v1/bookings { counselorId, date: '2024-09-14', time: '10:30' }
    
    critical Check and Reserve Slot
        Svc->>DB: BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE
        Svc->>DB: SELECT id FROM bookings WHERE counselor_id = 'amelia' AND session_time = '2024-09-14 10:30:00' FOR UPDATE
        alt Slot is Available
            Svc->>DB: INSERT INTO bookings (patient_id, counselor_id, session_time, status) VALUES (...)
            Svc->>DB: COMMIT TRANSACTION
            Svc-->>UI: 201 Created (Booking details, confirmation message)
            UI->>User: Set bookingConfirmed = true (Auto-clears after 4s)
        else Slot Conflict
            Svc->>DB: ROLLBACK
            Svc-->>UI: 409 Conflict ("This slot has just been taken")
            UI->>User: Prompt to choose another slot
        end
    end

    Svc->>Notif: Create Notification (type: 'upcoming_session', link: '/bookings')
    Notif->>DB: INSERT INTO notifications (user_id, title, description, time, read, link)
    Notif-->>Nav: Push notification event / badge count increment
    Nav->>User: Shows red dot on bell icon (Upcoming Session · Amelia Chen)
```

---

## 6. Database Entity Relationship Diagram (ERD)

This entity relationship diagram maps the storage requirements for user credentials, roles, counselor profiles, peer chat rooms, AI support sessions, bookings, and clinical relapse watchlist triggers:

```mermaid
erDiagram
    USERS ||--o{ USER_ROLES : has
    ROLES ||--o{ USER_ROLES : assigned_to
    USERS ||--o| COUNSELOR_PROFILES : has_specialty
    
    USERS ||--o{ CHAT_MESSAGES : sends
    USERS ||--o{ CHAT_MESSAGES : receives
    
    USERS ||--o{ AI_SESSIONS : owns
    AI_SESSIONS ||--o{ AI_MESSAGES : contains
    AI_MESSAGES ||--o{ CLINICAL_FLAGS : generates
    
    USERS ||--o{ BOOKINGS : books_as_patient
    COUNSELOR_PROFILES ||--o{ BOOKINGS : conducts_as_counselor
    
    USERS ||--o{ NOTIFICATIONS : receives_notif
    
    RELAPSE_WATCHLIST ||--o{ CLINICAL_FLAGS : matches_rule

    USERS {
        uuid id PK
        string full_name
        string username UK
        string email UK
        string password_hash
        string avatar_url
        timestamp created_at
        timestamp updated_at
    }

    ROLES {
        int id PK
        string role_name "patient | counselor | clinician_admin"
        string permissions_json
    }

    USER_ROLES {
        uuid user_id FK
        int role_id FK
    }

    COUNSELOR_PROFILES {
        uuid id PK
        uuid user_id FK
        string specialty
        string bio
        string license_number
        boolean is_online
        string avatar_bg
    }

    CHAT_MESSAGES {
        bigint id PK
        string room_id "Indexed compound key (user1_user2)"
        uuid sender_id FK
        uuid receiver_id FK
        text message_text
        string status "sending | sent | delivered | read"
        timestamp sent_at
    }

    AI_SESSIONS {
        uuid id PK
        uuid user_id FK
        string title "e.g. Daily Mindfulness & Stress"
        string preview_snippet
        timestamp last_interaction_at
        timestamp created_at
    }

    AI_MESSAGES {
        bigint id PK
        uuid session_id FK
        string sender "user | assistant"
        text content
        timestamp timestamp
        boolean has_clinical_flag
    }

    RELAPSE_WATCHLIST {
        string id PK "e.g. wl-1, wl-2"
        string trigger_name
        string category "Verbal Cues | Behavioral Signs | Cognitive Patterns"
        string severity "high | moderate | stable"
        text detection_cues
        text ai_action
        text clinical_rationale
        boolean is_active
    }

    CLINICAL_FLAGS {
        bigint id PK
        bigint ai_message_id FK
        string watchlist_id FK
        uuid patient_id FK
        int risk_score "0 - 100"
        string flag_description
        string status "unreviewed | acknowledged | escalated"
        timestamp flagged_at
    }

    BOOKINGS {
        uuid id PK
        uuid patient_id FK
        uuid counselor_id FK
        date session_date
        time session_time
        string status "Confirmed | Scheduled | Rescheduled | Completed | Cancelled"
        text notes
        timestamp created_at
        timestamp updated_at
    }

    NOTIFICATIONS {
        bigint id PK
        uuid user_id FK
        string icon "🗓️ | 💬 | 🌱"
        string title
        text description
        boolean is_read
        string link_target
        timestamp created_at
    }
```

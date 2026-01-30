# Agri Drone Service - Technical Documentation

## 1. Project Overview
This application is an **On-Demand Drone Spraying Service** platform connecting Farmers with Drone Operators (Pilots). It features a role-based dashboard system for Admins, Pilots, and Farmers to manage bookings, fleet operations, and service execution.

## 2. Technology Stack
-   **Framework**: Next.js 15+ (App Router)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS (Vanilla CSS variables for glassmorphism)
-   **Database**: Supabase (PostgreSQL)
-   **Authentication**: Supabase Auth (Phone OTP)
-   **State Management**: React Context API (`AuthContext`, `BookingContext`, `OperatorContext`)
-   **Icons**: Lucide React

## 3. Architecture & Core Logic

### 3.1 Authentication System
*   **Method**: Phone Number + OTP (One-Time Password).
*   **Flow**:
    1.  User enters phone number.
    2.  System checks if user exists in specific role tables (`farmers`, `operators`, `admins`).
    3.  If valid, `supabase.auth.signInWithOtp` is called.
    4.  User enters OTP -> `supabase.auth.verifyOtp`.
    5.  On success, `AuthContext` retrieves the user profile and session.
    6.  **Middleware** (`middleware.ts`) protects `/dashboard` routes, ensuring only authenticated users can access them.

### 3.2 Database Schema & Security
The system uses Supabase (PostgreSQL) with the following key tables:

*   **`farmers`**: Stores farmer profiles (Name, Phone, Land details).
*   **`operators`**: Stores pilot profiles (Name, Phone, Base Location, Service Areas, Status).
*   **`jobs`** (Bookings): Core entity linking Farmers and Operators.
    *   Columns: `status` ('pending', 'assigned', 'completed'), `acres`, `crop`, `location`, `farmer_id`, `operator_id`.
*   **`admins`**: High-level access control.

**Security Logic:**
*   **Row Level Security (RLS)**:
    *   *Current State*: Temporarily disabled/permissive for `operators` and `jobs` to allow rapid development with simulated auth transitions.
    *   *Production Goal*: RLS policies should restrict access based on `auth.uid()`.
*   **Environment Variables**: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` connect the client.

### 3.3 Key Context Modules (State Logic)

#### `AuthContext` (`lib/auth-context.tsx`)
*   **Responsibility**: centralized user session management.
*   **Logic**:
    *   Persists session via Supabase Auth + LocalStorage fallback.
    *   `signUp()`: Creates new records in `farmers` or `operators` tables and links them to the Supabase Auth ID.
    *   `login()`: Handles OTP challenge.

#### `BookingContext` (`lib/booking-context.tsx`)
*   **Responsibility**: Manages the lifecycle of a Booking (Job).
*   **Logic**:
    *   `fetchBookings()`: Subscribes to realtime changes on `jobs` table.
    *   `addBooking()`: Validates inputs (ensures `location` is not null) and inserts into DB.
    *   **Realtime**: Uses Supabase Channels to auto-update the dashboard when a booking status changes.

#### `OperatorContext` (`lib/operator-context.tsx`)
*   **Responsibility**: Fleet management logic.
*   **Logic**:
    *   Tracks Pilot Status (`Idle`, `In-Field`, `Off-Duty`).
    *   `addOperator()` / `editOperator()`: Admin functions to manage the fleet.
    *   Includes logic for Service Area mapping (Pincodes/Villages).

### 3.4 IVR System (Phone Booking)
We have exposed API routes to handle incoming calls from telephony providers (e.g., Twilio).

**Endpoints:**
1.  `[POST] /api/ivr`
    *   **Purpose**: Main Webhook. Receives call, identifies farmer by Caller ID.
    *   **Logic**:
        *   Checks `farmers` table for `From` number.
        *   Response (TwiML): Welcome message + Menu ("Press 1 to Book").
2.  `[POST] /api/ivr/booking`
    *   **Purpose**: Action Handler.
    *   **Logic**:
        *   If user pressed '1': Creates a `pending` job for the farmer's registered location.
        *   If user pressed '9': Forwards call to agent.

**Configuration:**
*   Point your Twilio/Exotel "Incoming Call" Webhook to `https://your-domain.com/api/ivr`.
*   Ensure `NEXT_PUBLIC_SUPABASE_ANON_KEY` has permission to `INSERT` into `jobs` (public access enabled).

### 3.5 Page Workflows

#### **Login Page (`app/page.tsx`)**
*   Dynamic "Typewriter" effect summary.
*   Dual Mode: **Login** vs **Register**.
*   **Register Flow**: 
    *   Captures Role (Farmer/Operator).
    *   Validates specific fields (Pincode for Farmers, Base Location for Operators).
    *   Triggers OTP verification before creating the account.
    *   Verification Step handles the DB insertion.

#### **Admin Dashboard (`app/dashboard/admin/*`)**
*   **Overview**: Live stats (Active Pilots, Acres Sprayed, Daily Ops).
*   **Bookings**: Table view with filtering/sorting. Allows assigning pilots to jobs.
*   **Operators**: Grid view of pilots with "Edit" capabilities.

#### **Operator Dashboard (`app/dashboard/operator/*`)**
*   Mobile-first design.
*   Shows "Today's Schedule".
*   Capabilities: Update Job Status (Start/Complete), Update Own Status (Online/Offline).

#### **Farmer Dashboard (`app/dashboard/farmer/*`)**
*   Simple interface to "Request Spraying".
*   Shows history of past bookings.

## 4. Production Readiness Checklist (Completed)
- [x] **Secure Auth**: Replaced simulation with real Supabase OTP.
- [x] **Middleware**: Added `middleware.ts` to block unauthorized access.
- [x] **Error Handling**: Improved `addBooking` error logging and fallback values.
- [x] **UI Polish**: Removed debug tools (Reset/Seed buttons) and placeholder texts.

## 5. Deployment Instructions
1.  **Environment**: Ensure `.env.local` has valid Supabase keys.
    *   `NEXT_PUBLIC_SUPABASE_URL`
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    *   `SUPABASE_SERVICE_ROLE_KEY` (Required for IVR System)
2.  **Database Security**:
    *   Go to Supabase Dashboard -> SQL Editor.
    *   Run the script: `supabase/refined_security.sql` to enable strict Role-Based Access Control (RBAC).
    *   This eliminates "Permissive Policy" warnings and secures the data layer.
3.  **Build**: Run `npm run build` to compile the optimized production build.
4.  **Start**: Run `npm start` to serve the app.

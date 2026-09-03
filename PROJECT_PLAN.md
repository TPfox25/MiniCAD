# MiniCAD Project Plan

## 1. Objective

Build a small Computer-Aided Dispatch system consisting of:

- A Next.js web application for Dispatchers
- A React Native mobile application for Officers
- A Supabase backend using PostgreSQL, Authentication and Realtime
- Push notifications for dispatched incidents

The main workflow is:

Dispatcher creates incident → Dispatcher dispatches incident →
on-duty Officer receives notification → Officer claims incident →
Officer updates response status → Officer submits report →
Dispatcher views report.

---

## 2. Functional Requirements

### Dispatcher

- Login as Dispatcher
- Create a new incident
- View incidents
- Dispatch incidents
- View currently eligible officers
- View live incident status
- View officer who claimed an incident
- View submitted incident reports

### Officer

- Login as Officer
- Set themselves on duty
- Set themselves off duty
- Receive push notifications
- View open dispatched incidents
- Claim an incident
- Update incident status
- Submit an incident report

---

## 3. Non-Functional Requirements

- React / Next.js web application
- React Native mobile application
- Supabase PostgreSQL database
- Supabase Authentication
- Supabase Realtime
- Push notifications
- Row Level Security
- Git/GitHub source control
- Vercel deployment
- Android APK

---

## 4. Development Phases

### Phase 1 - Project Setup

Deliverables:

- Git repository
- Project structure
- Project plan

### Phase 2 - Backend

Deliverables:

- Supabase project
- Database schema
- Authentication
- RLS policies

### Phase 3 - Dispatcher Web Application

Deliverables:

- Dispatcher login
- Dashboard
- Incident creation
- Incident list
- Officer list
- Dispatch functionality

### Phase 4 - Realtime

Deliverables:

- Live incident updates
- Live officer status
- Live claim updates

### Phase 5 - Officer Mobile Application

Deliverables:

- Officer login
- Duty status
- Open incident list
- Incident details
- Claim functionality

### Phase 6 - Integration

Deliverables:

- Push notifications
- Incident status workflow
- Officer reporting

### Phase 7 - Testing

Deliverables:

- End-to-end testing
- Error handling
- Loading states
- Empty states
- RLS testing

### Phase 8 - Deployment

Deliverables:

- Vercel deployment
- Android APK
- GitHub repository

### Phase 9 - Documentation

Deliverables:

- README
- Architecture diagram
- ERD
- Known limitations
- Test credentials
- Demo video
- Submission document

---

## 5. Timeline

### Thursday

- Project setup
- Supabase setup
- Database
- Authentication
- Dispatcher dashboard
- Incident creation
- Incident dispatch
- Realtime

### Friday

- Officer mobile application
- Officer authentication
- Duty status
- Incident list
- Incident claiming
- Status updates
- Push notifications
- Incident report

### Saturday

- Testing
- RLS
- Error handling
- Deployment
- APK
- README
- Diagrams
- Demo video
- Submission document

---

## 6. Assumptions and Trade-offs

The project is intentionally focused on the core dispatch workflow
because of the limited assessment timeline.

The user interface will remain simple rather than focusing on
advanced visual design.

Authentication will use seeded test accounts instead of a full
registration system.

Advanced features such as incident history, advanced filtering,
analytics and maps will only be implemented if the core workflow
is completed first.

The project will prioritise a working end-to-end system over
additional features.
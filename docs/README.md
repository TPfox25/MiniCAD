# MiniCAD

MiniCAD is a small-scale Computer-Aided Dispatch (CAD) system built as a full-stack technical assessment. It provides a web application for dispatchers and a mobile application for officers, and Supabase records and persists the data stored.

The project focuses on the required end-to-end workflow:

Dispatcher logs an incident → incident is dispatched to on-duty officers → officer receives a device push notification → officer claims the incident → officer updates the response status → officer submits a report → dispatcher sees the report.

## 1. Project Overview

MiniCAD contains two applications:

- Web application: Next.js / React application for dispatchers.
- Mobile application: Expo / React Native application for officers.

The project was kept small and focused on the core CAD workflow required by the assessment.

## 2. Features

### Dispatcher Web Application

- Dispatcher login.
- Create and log new incidents.
- Capture caller name, caller phone, location, incident type, priority and description.
- View the incident queue.
- View officer duty/availability status.
- Dispatch incidents to the current on-duty officer pool.
- View live incident status changes.
- See which officer claimed an incident.
- View the officer's submitted incident report.

### Officer Mobile Application

- Officer login.
- Explicit On Duty / Off Duty control.
- View open dispatched incidents while on duty.
- Receive a device push notification when a new incident is dispatched while on duty.
- Claim an available incident.
- View claimed active incidents.
- Update an incident from Claimed → En Route → On Scene.
- Submit an incident report.
- Move the incident to Resolved after report submission.
- Receive live incident updates through Supabase Realtime.


## 3. Incident Creation Flow

The dispatcher starts by creating a new incident from the Dispatcher Dashboard.

The dispatcher enters:

- Caller Name
- Caller Phone Number
- Location
- Incident Type
- Priority
- Description

Once the dispatcher submits the form, the incident is saved to the Supabase database with a status of New.

The dispatcher can then dispatch the incident to the available on-duty officer pool.

The overall creation flow is:

Dispatcher -> Create Incident -> Enter Incident Details -> Save to Supabase ->Status: New -> Dispatch Incident -> Status: Dispatched -> Officer Receives Notification

## 4. Incident Status Flow

New -> Dispatched -> Claimed -> En Route -> On Scene -> Resolved (Report Submitted)


## 5. Known Limitations / Shortcuts

- Pagination was not implemented because the assessment uses a small dataset and the focus was placed on completing the core real-time dispatch workflow and because of the time constraint that was given.

- I created a starter template using Next.js which helped in rendering the pages instead of having to generate them manually. If I had more time, I would enhance the UI/UX experience further.

- I had to cut out the optional functionality since I was focused on the main functionality, however if I had more time, I would have implemented this functionality:

Basic incident priority sorting/filtering on the dispatcher queue.
A simple history view for the dispatcher of past resolved incidents and their reports.

- The current push_tokens table stores one current push-token record per user. A production implementation could support multiple devices per officer.


## Environment Variables

### Web Application

Create a .env.local file inside the web folder:

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url

NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_key

SUPABASE_SERVICE_ROLE_KEY=your_service_role_key


### Mobile Application

Create a .env file inside the mobile folder:

EXPO_PUBLIC_SUPABASE_URL=your_supabase_url

EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_key


## Local Setup / Run

## 1. Clone the project

- git clone https://github.com/TPfox25/MiniCAD.git


## 2. Run the Web App

- cd web
- npm install
- npm run dev

- Open http://localhost:3000


## 3. Run the Mobile App

- cd MiniCAD/mobile
- npm install
- npx expo start
- npm start

**NB: Use Expo to open the application on an Android emulator or physical Android device for full testing.**
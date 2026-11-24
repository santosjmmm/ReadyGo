# ReadyGo

ReadyGo is a CarRent management platform with a NestJS API and a polished frontend dashboard for browsing vehicles, reserving cars, and using member access flows.

## Tech stack
- NestJS
- TypeORM
- SQLite for local development (default)
- MySQL-ready configuration
- JWT authentication
- Validation with class-validator
- Static frontend served from the public folder

## Features
- Customer registration and login
- JWT-protected access
- Customer CRUD
- Admin CRUD
- Car CRUD
- Reservation CRUD
- Payment CRUD
- Rental record CRUD
- Modern UI/UX landing page and booking dashboard
- Philippines-localized trip planning (PHP pricing, Philippine cities, Manila dates, and kilometers)
- Customer booking confirmation that saves pending reservations and pick-up locations
- Customer reservation history with booking dates, locations, totals, and status
- Customer demo payment simulation (no real charges are processed)
- Admin management workspace with create, search, edit, and delete screens for all six data modules
- Car photo uploads (JPG, PNG, or WebP; maximum 5 MB) with image previews

## Getting started
1. Install dependencies:
   npm install
2. Copy the environment file:
   copy .env.example .env
3. Set `JWT_SECRET` in `.env` to a long, random value before starting the app.
4. Start the app in development mode:
   npm run start:dev
5. Open the frontend in the browser:
   http://localhost:3000
6. API base URL:
   http://localhost:3000/api/carrent/v1

## Auth example
POST /api/carrent/v1/auth/register
POST /api/carrent/v1/auth/login
GET /api/carrent/v1/auth/profile

## Notes
The app serves the frontend at the root URL while keeping the NestJS API under the CarRent v1 prefix. The frontend displays car `dailyRate` values as Philippine pesos (PHP), so enter those amounts in PHP when adding cars. The trip estimate is informational until the customer selects **Confirm booking**; confirmation creates a pending reservation with its dates, location, and estimated total.

Car photos can be uploaded from the car form or provided as an image URL. Local uploads are stored under `storage/car-images/`, served through the API, and excluded from version control.

The management workspace is displayed after signing in with an admin account. On a fresh database, use the first-time setup form in the account panel to create the first admin. The existing CRUD API routes do not enforce role-based authorization; do not expose this prototype publicly without adding server-side access controls.

# ShareTrento - Car Sharing Application

A simulated car-sharing web application for the city of Trento, built as a university software engineering project.

## Project Overview

ShareTrento allows drivers to offer trips and passengers to book available seats. The focus is on software architecture, REST APIs, JWT-based authentication, and clean code practices.

## Tech Stack

- **Frontend**: Vue.js 3 (SPA), Vite, Vue Router, Axios, Leaflet (maps)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with role-based access (DRIVER / PASSENGER)
- **Maps & Geocoding**: Leaflet + OpenStreetMap Nominatim
- **Email Notifications**: Nodemailer (booking confirmations)
- **API Documentation**: OpenAPI/Swagger
- **Testing**: Jest + Supertest

## Project Structure

```
ShareTrento/
├── backend/
│   ├── src/
│   │   ├── config/         # Database, email & Swagger config
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth & error handling
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Mailer utility
│   │   ├── app.js          # Express app setup
│   │   └── index.js        # Server entry point
│   ├── tests/              # Jest test files
│   ├── .env                # Environment variables
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── views/          # Vue page components
    │   ├── components/     # Reusable components (LocationPicker, TripMap)
    │   ├── App.vue         # Root component
    │   ├── main.js         # Vue app entry
    │   └── api.js          # Axios API client
    ├── index.html
    └── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or MongoDB Atlas)

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

The API will be available at `http://localhost:3000`
API Documentation at `http://localhost:3000/api-docs`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Running Tests

```bash
cd backend
npm test
```

## API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | - |
| POST | `/api/auth/login` | Login user | - |
| GET | `/api/auth/me` | Get current user | Required |
| PUT | `/api/auth/profile` | Update profile | Required |
| PUT | `/api/auth/password` | Change password | Required |

### Trips
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/trips` | Get all available trips | - |
| GET | `/api/trips/:id` | Get trip by ID | - |
| POST | `/api/trips/search` | Search matching trips | - |
| POST | `/api/trips` | Create new trip | DRIVER |
| GET | `/api/trips/my-trips` | Get driver's trips | DRIVER |
| DELETE | `/api/trips/:id` | Delete trip | DRIVER |

### Bookings
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/bookings` | Join a trip | PASSENGER |
| PATCH | `/api/bookings/:id/cancel` | Cancel booking | PASSENGER |
| GET | `/api/bookings/my-bookings` | Get user's bookings | Required |
| GET | `/api/bookings/trip/:tripId` | Get trip's bookings | DRIVER |

### Reviews
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/reviews` | Create a review | PASSENGER |
| GET | `/api/reviews/driver/:driverId` | Get driver reviews | - |
| GET | `/api/reviews/my-reviews` | Get user's reviews | Required |

### Favorites
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/favorites` | Get saved searches | Required |
| POST | `/api/favorites` | Save a search | Required |
| DELETE | `/api/favorites/:id` | Delete a saved search | Required |

## Authentication

The API uses JWT (JSON Web Token) for authentication.

1. Register or login to receive a token
2. Include the token in the Authorization header: `Bearer <token>`

### Roles
- **DRIVER**: Can create trips and view their trip's bookings
- **PASSENGER**: Can search for trips and make bookings

## Features

- Interactive map with Leaflet for trip visualization (origin/destination markers, route lines)
- Location picker with geocoding (OpenStreetMap Nominatim, biased to Trentino region)
- Email notifications on booking (driver + passenger)
- Driver rating system with star reviews
- Favorite search saving and quick re-search
- Responsive UI with role-aware navigation

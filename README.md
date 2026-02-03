# ShareTrento - Car Sharing Application

A simulated car-sharing web application for the city of Trento, built as a university software engineering project.

## 🚗 Project Overview

ShareTrento allows drivers to offer trips and passengers to book available seats. The focus is on software architecture, REST APIs, JWT-based authentication, and clean code practices.

## 🛠️ Tech Stack

- **Frontend**: Vue.js 3 (SPA), Vite, Vue Router, Axios
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with role-based access (DRIVER / PASSENGER)
- **API Documentation**: OpenAPI/Swagger
- **Testing**: Jest + Supertest

## 📁 Project Structure

```
ShareTrento/
├── backend/
│   ├── src/
│   │   ├── config/         # Database & Swagger config
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth & error handling
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # API routes
│   │   ├── app.js          # Express app setup
│   │   └── index.js        # Server entry point
│   ├── tests/              # Jest test files
│   ├── .env                # Environment variables
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── views/          # Vue page components
    │   ├── App.vue         # Root component
    │   ├── main.js         # Vue app entry
    │   └── api.js          # Axios API client
    ├── index.html
    └── package.json
```

## 🚀 Getting Started

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

## 📚 API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | - |
| POST | `/api/auth/login` | Login user | - |
| GET | `/api/auth/me` | Get current user | Required |

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

## 🔐 Authentication

The API uses JWT (JSON Web Token) for authentication.

1. Register or login to receive a token
2. Include the token in the Authorization header: `Bearer <token>`

### Roles
- **DRIVER**: Can create trips and view their trip's bookings
- **PASSENGER**: Can search for trips and make bookings

## 📋 Business Rules

1. Only DRIVER role can create trips
2. Only PASSENGER role can join trips
3. Passengers can only join trips with available seats (> 0)
4. Joining a trip decreases available seats by 1
5. Cancelling a booking restores the seat
6. Trip matching criteria:
   - Same origin (case-insensitive)
   - Same destination (case-insensitive)
   - Departure time within ±30 minutes

## 🧪 Test Coverage

The test suite covers:
- ✅ User registration and login
- ✅ JWT token generation and validation
- ✅ Protected route rejection without token
- ✅ Role-based access control (DRIVER can create trips, PASSENGER cannot)
- ✅ Trip creation with validation
- ✅ Booking creation with seat management
- ✅ Booking cancellation with seat restoration
- ✅ No booking when no seats available

## 🎓 Educational Notes

This project intentionally simplifies certain aspects:
- Payments are simulated
- Locations are simple text strings (no real maps)
- Notifications are not implemented
- Email verification is not implemented
- Refresh tokens are not implemented

The focus is on demonstrating:
- Clean Express architecture
- RESTful API design
- JWT authentication flow
- Role-based authorization
- MongoDB data modeling
- Vue.js SPA patterns
- API documentation with OpenAPI/Swagger

## 📄 License

University project - Educational use only

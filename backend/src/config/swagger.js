const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ShareTrento API',
      version: '1.0.0',
      description: `
# ShareTrento Car-Sharing API

A simulated car-sharing application for the city of Trento.

## Authentication

This API uses JWT (JSON Web Token) for authentication. 

To access protected endpoints:
1. Register or login to get a token
2. Include the token in the Authorization header: \`Bearer <token>\`

## Roles

- **DRIVER**: Can create trips and view bookings for their trips
- **PASSENGER**: Can search for trips and make bookings

## Business Rules

- Passengers can only join trips with available seats
- Joining a trip decreases available seats by 1
- Cancelling a booking restores the seat
- Matching rules: same origin, same destination, departure time within ±30 minutes
      `,
      contact: {
        name: 'ShareTrento Team',
        email: 'support@sharetrento.example.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'User ID'
            },
            name: {
              type: 'string',
              description: 'User full name'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            role: {
              type: 'string',
              enum: ['DRIVER', 'PASSENGER'],
              description: 'User role'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Trip: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Trip ID'
            },
            origin: {
              type: 'string',
              description: 'Trip origin location'
            },
            destination: {
              type: 'string',
              description: 'Trip destination location'
            },
            departureTime: {
              type: 'string',
              format: 'date-time',
              description: 'Departure date and time'
            },
            availableSeats: {
              type: 'integer',
              minimum: 0,
              maximum: 8,
              description: 'Number of available seats'
            },
            driverId: {
              $ref: '#/components/schemas/User'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Booking: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Booking ID'
            },
            tripId: {
              $ref: '#/components/schemas/Trip'
            },
            passengerId: {
              $ref: '#/components/schemas/User'
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'CONFIRMED', 'CANCELLED'],
              description: 'Booking status'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: 'Error message'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User registration and login endpoints'
      },
      {
        name: 'Trips',
        description: 'Trip management endpoints'
      },
      {
        name: 'Bookings',
        description: 'Booking management endpoints'
      }
    ]
  },
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

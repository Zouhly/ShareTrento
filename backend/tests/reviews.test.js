const request = require('supertest');
const createApp = require('../src/app');

const app = createApp();

describe('Review Endpoints', () => {
  let driverToken;
  let passengerToken;
  let passenger2Token;
  let driverId;
  let tripId;

  beforeEach(async () => {
    // Create a driver
    const driverRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Driver',
        email: 'driver@example.com',
        password: 'password123',
        role: 'DRIVER'
      });
    driverToken = driverRes.body.data.token;
    driverId = driverRes.body.data.user._id;

    // Add car info to driver
    await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        car: {
          brand: 'Fiat',
          model: 'Panda',
          color: 'White',
          seats: 5
        }
      });

    // Create a passenger
    const passengerRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Passenger',
        email: 'passenger@example.com',
        password: 'password123',
        role: 'PASSENGER'
      });
    passengerToken = passengerRes.body.data.token;

    // Create second passenger
    const passenger2Res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Passenger 2',
        email: 'passenger2@example.com',
        password: 'password123',
        role: 'PASSENGER'
      });
    passenger2Token = passenger2Res.body.data.token;

    // Create a trip in the past (so it can be reviewed)
    // We need to create it directly in the DB since the API won't allow past dates
    const { Trip } = require('../src/models');
    const trip = new Trip({
      origin: { address: 'Trento Centro', lat: 46.0679, lng: 11.1211 },
      destination: { address: 'Rovereto', lat: 45.8903, lng: 11.0340 },
      departureTime: new Date(Date.now() - 86400000), // Yesterday
      availableSeats: 2,
      driverId
    });
    await trip.save();
    tripId = trip._id.toString();

    // Create a confirmed booking for passenger (directly in DB)
    const { Booking } = require('../src/models');
    await new Booking({
      tripId: trip._id,
      passengerId: passengerRes.body.data.user._id,
      status: 'CONFIRMED'
    }).save();
  });

  describe('POST /api/reviews', () => {
    it('should allow passenger to review a completed trip', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({
          tripId,
          rating: 4,
          comment: 'Great driver!'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.review.rating).toBe(4);
      expect(res.body.data.review.comment).toBe('Great driver!');
    });

    it('should NOT allow reviewing the same trip twice', async () => {
      await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({ tripId, rating: 5 });

      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({ tripId, rating: 3 });

      expect(res.statusCode).toBe(409);
    });

    it('should NOT allow driver to submit reviews', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ tripId, rating: 5 });

      expect(res.statusCode).toBe(403);
    });

    it('should NOT allow reviewing without a booking', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${passenger2Token}`)
        .send({ tripId, rating: 4 });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain('booked');
    });

    it('should NOT allow reviewing a future trip', async () => {
      // Create a future trip
      const { Trip, Booking } = require('../src/models');
      const futureTrip = new Trip({
        origin: { address: 'Trento', lat: 46.0679, lng: 11.1211 },
        destination: { address: 'Bolzano', lat: 46.4983, lng: 11.3548 },
        departureTime: new Date(Date.now() + 86400000),
        availableSeats: 3,
        driverId
      });
      await futureTrip.save();

      // Create booking for it
      const passengerRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${passengerToken}`);
      
      await new Booking({
        tripId: futureTrip._id,
        passengerId: passengerRes.body.data.user._id,
        status: 'CONFIRMED'
      }).save();

      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({ tripId: futureTrip._id.toString(), rating: 5 });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('departed');
    });

    it('should reject invalid ratings', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({ tripId, rating: 6 });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/reviews/driver/:driverId', () => {
    it('should return driver reviews with average rating', async () => {
      // Submit a review first
      await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({ tripId, rating: 4, comment: 'Good' });

      const res = await request(app)
        .get(`/api/reviews/driver/${driverId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.reviews.length).toBe(1);
      expect(res.body.data.averageRating).toBe(4);
      expect(res.body.data.reviewCount).toBe(1);
    });

    it('should return empty for driver with no reviews', async () => {
      const res = await request(app)
        .get(`/api/reviews/driver/${driverId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.reviews.length).toBe(0);
      expect(res.body.data.averageRating).toBe(0);
    });
  });

  describe('GET /api/reviews/my-reviews', () => {
    it('should return reviews written by the authenticated user', async () => {
      // Submit a review
      await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({ tripId, rating: 5, comment: 'Excellent' });

      const res = await request(app)
        .get('/api/reviews/my-reviews')
        .set('Authorization', `Bearer ${passengerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.reviews.length).toBe(1);
      expect(res.body.data.reviews[0].rating).toBe(5);
    });
  });
});

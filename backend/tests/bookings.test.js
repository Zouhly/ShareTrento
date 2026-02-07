const request = require('supertest');
const createApp = require('../src/app');

const app = createApp();

describe('Booking Endpoints', () => {
  let driverToken;
  let passengerToken;
  let passenger2Token;
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

    // Create a trip
    const tripRes = await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        origin: { address: 'Trento Centro', lat: 46.0679, lng: 11.1211 },
        destination: { address: 'Rovereto', lat: 45.8903, lng: 11.0340 },
        departureTime: new Date(Date.now() + 86400000).toISOString(),
        availableSeats: 2
      });
    tripId = tripRes.body.data.trip._id;
  });

  describe('POST /api/bookings (Join Trip)', () => {
    it('should allow PASSENGER to join a trip', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({ tripId });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.booking.status).toBe('CONFIRMED');
    });

    it('should decrease available seats when joining', async () => {
      await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({ tripId });

      const tripRes = await request(app)
        .get(`/api/trips/${tripId}`);

      expect(tripRes.body.data.trip.availableSeats).toBe(1); // Was 2, now 1
    });

    it('should NOT allow DRIVER to join a trip', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ tripId });

      expect(res.statusCode).toBe(403);
    });

    it('should NOT allow booking same trip twice', async () => {
      // First booking
      await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({ tripId });

      // Second booking
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({ tripId });

      expect(res.statusCode).toBe(409);
    });

    it('should fail when no seats available', async () => {
      // Create a trip with only 1 seat
      const tripRes = await request(app)
        .post('/api/trips')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          origin: { address: 'Trento', lat: 46.0679, lng: 11.1211 },
          destination: { address: 'Bolzano', lat: 46.4983, lng: 11.3548 },
          departureTime: new Date(Date.now() + 86400000).toISOString(),
          availableSeats: 1
        });
      const singleSeatTripId = tripRes.body.data.trip._id;

      // First passenger books
      await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({ tripId: singleSeatTripId });

      // Second passenger tries to book
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${passenger2Token}`)
        .send({ tripId: singleSeatTripId });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('No available seats');
    });
  });

  describe('PATCH /api/bookings/:id/cancel', () => {
    let bookingId;

    beforeEach(async () => {
      // Create a booking
      const bookingRes = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({ tripId });
      bookingId = bookingRes.body.data.booking._id;
    });

    it('should allow passenger to cancel their booking', async () => {
      const res = await request(app)
        .patch(`/api/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${passengerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.booking.status).toBe('CANCELLED');
    });

    it('should restore seat when cancelling', async () => {
      // Trip started with 2 seats, booking reduced to 1
      await request(app)
        .patch(`/api/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${passengerToken}`);

      const tripRes = await request(app)
        .get(`/api/trips/${tripId}`);

      expect(tripRes.body.data.trip.availableSeats).toBe(2); // Restored
    });

    it('should NOT allow cancelling someone else\'s booking', async () => {
      const res = await request(app)
        .patch(`/api/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${passenger2Token}`);

      expect(res.statusCode).toBe(403);
    });

    it('should NOT allow driver to cancel bookings', async () => {
      const res = await request(app)
        .patch(`/api/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${driverToken}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/bookings/my-bookings', () => {
    it('should return bookings for the authenticated user', async () => {
      // Create a booking
      await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({ tripId });

      const res = await request(app)
        .get('/api/bookings/my-bookings')
        .set('Authorization', `Bearer ${passengerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.bookings.length).toBe(1);
    });
  });

  describe('GET /api/bookings/trip/:tripId', () => {
    beforeEach(async () => {
      // Create bookings
      await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({ tripId });

      await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${passenger2Token}`)
        .send({ tripId });
    });

    it('should allow driver to view bookings for their trip', async () => {
      const res = await request(app)
        .get(`/api/bookings/trip/${tripId}`)
        .set('Authorization', `Bearer ${driverToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.bookings.length).toBe(2);
    });

    it('should NOT allow passenger to view trip bookings', async () => {
      const res = await request(app)
        .get(`/api/bookings/trip/${tripId}`)
        .set('Authorization', `Bearer ${passengerToken}`);

      expect(res.statusCode).toBe(403);
    });
  });
});

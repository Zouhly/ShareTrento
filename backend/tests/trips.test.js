const request = require('supertest');
const createApp = require('../src/app');

const app = createApp();

describe('Trip Endpoints', () => {
  let driverToken;
  let passengerToken;
  let driverId;

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
  });

  describe('POST /api/trips', () => {
    const validTrip = {
      origin: { address: 'Trento Centro', lat: 46.0679, lng: 11.1211 },
      destination: { address: 'Rovereto', lat: 45.8903, lng: 11.0340 },
      departureTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      availableSeats: 3
    };

    it('should allow DRIVER to create a trip', async () => {
      const res = await request(app)
        .post('/api/trips')
        .set('Authorization', `Bearer ${driverToken}`)
        .send(validTrip);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.trip.origin.address).toBe('Trento Centro');
      expect(res.body.data.trip.destination.address).toBe('Rovereto');
      expect(res.body.data.trip.availableSeats).toBe(3);
    });

    it('should NOT allow PASSENGER to create a trip', async () => {
      const res = await request(app)
        .post('/api/trips')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send(validTrip);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('DRIVER');
    });

    it('should reject trip creation without authentication', async () => {
      const res = await request(app)
        .post('/api/trips')
        .send(validTrip);

      expect(res.statusCode).toBe(401);
    });

    it('should reject trip with past departure time', async () => {
      const res = await request(app)
        .post('/api/trips')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          ...validTrip,
          departureTime: new Date(Date.now() - 86400000).toISOString() // Yesterday
        });

      expect(res.statusCode).toBe(400);
    });

    it('should reject trip with invalid seat count', async () => {
      const res = await request(app)
        .post('/api/trips')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          ...validTrip,
          availableSeats: 10
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/trips', () => {
    beforeEach(async () => {
      // Create some trips
      await request(app)
        .post('/api/trips')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          origin: { address: 'Trento', lat: 46.0679, lng: 11.1211 },
          destination: { address: 'Rovereto', lat: 45.8903, lng: 11.0340 },
          departureTime: new Date(Date.now() + 86400000).toISOString(),
          availableSeats: 3
        });

      await request(app)
        .post('/api/trips')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          origin: { address: 'Trento', lat: 46.0679, lng: 11.1211 },
          destination: { address: 'Bolzano', lat: 46.4983, lng: 11.3548 },
          departureTime: new Date(Date.now() + 172800000).toISOString(),
          availableSeats: 2
        });
    });

    it('should return all available trips', async () => {
      const res = await request(app)
        .get('/api/trips');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.trips.length).toBe(2);
    });

    it('should filter trips by origin', async () => {
      const res = await request(app)
        .get('/api/trips?origin=Trento');

      expect(res.statusCode).toBe(200);
      expect(res.body.data.trips.length).toBe(2);
    });

    it('should filter trips by destination', async () => {
      const res = await request(app)
        .get('/api/trips?destination=Rovereto');

      expect(res.statusCode).toBe(200);
      expect(res.body.data.trips.length).toBe(1);
    });
  });

  describe('POST /api/trips/search', () => {
    beforeEach(async () => {
      const baseTime = new Date(Date.now() + 86400000); // Tomorrow

      // Create trips at different times
      await request(app)
        .post('/api/trips')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          origin: { address: 'Trento Centro', lat: 46.0679, lng: 11.1211 },
          destination: { address: 'Rovereto', lat: 45.8903, lng: 11.0340 },
          departureTime: baseTime.toISOString(),
          availableSeats: 3
        });

      // Trip 20 minutes later (within 30 min window)
      await request(app)
        .post('/api/trips')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          origin: { address: 'Trento Centro', lat: 46.0679, lng: 11.1211 },
          destination: { address: 'Rovereto', lat: 45.8903, lng: 11.0340 },
          departureTime: new Date(baseTime.getTime() + 20 * 60000).toISOString(),
          availableSeats: 2
        });

      // Trip 2 hours later (outside 30 min window)
      await request(app)
        .post('/api/trips')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          origin: { address: 'Trento Centro', lat: 46.0679, lng: 11.1211 },
          destination: { address: 'Rovereto', lat: 45.8903, lng: 11.0340 },
          departureTime: new Date(baseTime.getTime() + 2 * 3600000).toISOString(),
          availableSeats: 4
        });
    });

    it('should find trips within ±30 minutes', async () => {
      const baseTime = new Date(Date.now() + 86400000);

      const res = await request(app)
        .post('/api/trips/search')
        .send({
          origin: { address: 'Trento Centro', lat: 46.0679, lng: 11.1211 },
          destination: { address: 'Rovereto', lat: 45.8903, lng: 11.0340 },
          departureTime: new Date(baseTime.getTime() + 10 * 60000).toISOString()
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.trips.length).toBe(2); // Only 2 trips within 30 min
    });
  });

  describe('GET /api/trips/my-trips', () => {
    it('should return trips for the authenticated driver', async () => {
      // Create a trip
      await request(app)
        .post('/api/trips')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          origin: { address: 'Trento', lat: 46.0679, lng: 11.1211 },
          destination: { address: 'Rovereto', lat: 45.8903, lng: 11.0340 },
          departureTime: new Date(Date.now() + 86400000).toISOString(),
          availableSeats: 3
        });

      const res = await request(app)
        .get('/api/trips/my-trips')
        .set('Authorization', `Bearer ${driverToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.trips.length).toBe(1);
    });

    it('should reject passenger access to my-trips', async () => {
      const res = await request(app)
        .get('/api/trips/my-trips')
        .set('Authorization', `Bearer ${passengerToken}`);

      expect(res.statusCode).toBe(403);
    });
  });
});

const request = require('supertest');
const createApp = require('../src/app');
const { User } = require('../src/models');

const app = createApp();

describe('Authentication Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user and return a token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'PASSENGER'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe('test@example.com');
      expect(res.body.data.user.role).toBe('PASSENGER');
      expect(res.body.data.user.passwordHash).toBeUndefined(); // Should not expose password
    });

    it('should register a DRIVER user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Driver User',
          email: 'driver@example.com',
          password: 'password123',
          role: 'DRIVER'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.user.role).toBe('DRIVER');
    });

    it('should fail with missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail with invalid role', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'ADMIN'
        });

      expect(res.statusCode).toBe(400);
    });

    it('should fail with duplicate email', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'First User',
          email: 'duplicate@example.com',
          password: 'password123',
          role: 'PASSENGER'
        });

      // Second registration with same email
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Second User',
          email: 'duplicate@example.com',
          password: 'password456',
          role: 'DRIVER'
        });

      expect(res.statusCode).toBe(409);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Login Test User',
          email: 'login@example.com',
          password: 'password123',
          role: 'PASSENGER'
        });
    });

    it('should login with valid credentials and return token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe('login@example.com');
    });

    it('should fail with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should fail with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    let token;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Me Test User',
          email: 'me@example.com',
          password: 'password123',
          role: 'PASSENGER'
        });
      token = res.body.data.token;
    });

    it('should return current user with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.user.email).toBe('me@example.com');
    });

    it('should reject request without token', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.statusCode).toBe(401);
    });

    it('should reject request with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.statusCode).toBe(401);
    });
  });

  describe('PUT /api/auth/profile', () => {
    let token;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Profile User',
          email: 'profile@example.com',
          password: 'password123',
          role: 'DRIVER'
        });
      token = res.body.data.token;
    });

    it('should update user name', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.name).toBe('Updated Name');
    });

    it('should update car info for driver', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          car: { brand: 'Fiat', model: 'Panda', color: 'White', seats: 5 }
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.user.car.brand).toBe('Fiat');
      expect(res.body.data.user.car.seats).toBe(5);
    });

    it('should reject duplicate email', async () => {
      // Register another user
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Other User',
          email: 'taken@example.com',
          password: 'password123',
          role: 'PASSENGER'
        });

      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'taken@example.com' });

      expect(res.statusCode).toBe(409);
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .send({ name: 'Hacker' });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('PUT /api/auth/password', () => {
    let token;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Password User',
          email: 'password@example.com',
          password: 'password123',
          role: 'PASSENGER'
        });
      token = res.body.data.token;
    });

    it('should change password successfully', async () => {
      const res = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword456'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify login with new password works
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'password@example.com',
          password: 'newpassword456'
        });
      expect(loginRes.statusCode).toBe(200);
    });

    it('should reject with wrong current password', async () => {
      const res = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword456'
        });

      expect(res.statusCode).toBe(401);
    });

    it('should reject short new password', async () => {
      const res = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'password123',
          newPassword: '123'
        });

      expect(res.statusCode).toBe(400);
    });

    it('should reject missing fields', async () => {
      const res = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: 'password123' });

      expect(res.statusCode).toBe(400);
    });
  });
});

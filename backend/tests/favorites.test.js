const request = require('supertest');
const createApp = require('../src/app');

const app = createApp();

describe('Favorite Endpoints', () => {
  let userToken;
  let user2Token;

  beforeEach(async () => {
    // Create a user
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'user@example.com',
        password: 'password123',
        role: 'PASSENGER'
      });
    userToken = userRes.body.data.token;

    // Create a second user
    const user2Res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'User Two',
        email: 'user2@example.com',
        password: 'password123',
        role: 'DRIVER'
      });
    user2Token = user2Res.body.data.token;
  });

  describe('POST /api/favorites', () => {
    it('should create a favorite search', async () => {
      const res = await request(app)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          label: 'Daily commute',
          origin: 'Trento',
          destination: 'Rovereto',
          preferredTime: '08:30'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.favorite.label).toBe('Daily commute');
      expect(res.body.data.favorite.origin).toBe('Trento');
      expect(res.body.data.favorite.destination).toBe('Rovereto');
      expect(res.body.data.favorite.preferredTime).toBe('08:30');
    });

    it('should create a favorite without preferredTime', async () => {
      const res = await request(app)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          label: 'Weekend trip',
          origin: 'Trento',
          destination: 'Bolzano'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.favorite.preferredTime).toBeUndefined();
    });

    it('should reject duplicate origin/destination for same user', async () => {
      await request(app)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          label: 'First',
          origin: 'Trento',
          destination: 'Rovereto'
        });

      const res = await request(app)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          label: 'Second',
          origin: 'Trento',
          destination: 'Rovereto'
        });

      expect(res.statusCode).toBe(409);
    });

    it('should allow same origin/destination for different users', async () => {
      await request(app)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          label: 'User 1 commute',
          origin: 'Trento',
          destination: 'Rovereto'
        });

      const res = await request(app)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          label: 'User 2 commute',
          origin: 'Trento',
          destination: 'Rovereto'
        });

      expect(res.statusCode).toBe(201);
    });

    it('should reject missing required fields', async () => {
      const res = await request(app)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ label: 'Incomplete' });

      expect(res.statusCode).toBe(400);
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app)
        .post('/api/favorites')
        .send({
          label: 'No auth',
          origin: 'Trento',
          destination: 'Rovereto'
        });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/favorites', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          label: 'Commute',
          origin: 'Trento',
          destination: 'Rovereto'
        });

      await request(app)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          label: 'Weekend',
          origin: 'Trento',
          destination: 'Bolzano'
        });

      // Different user's favorite - should not appear
      await request(app)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          label: 'Other user',
          origin: 'Rovereto',
          destination: 'Verona'
        });
    });

    it('should return only the current user favorites', async () => {
      const res = await request(app)
        .get('/api/favorites')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.data.favorites.length).toBe(2);
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app)
        .get('/api/favorites');

      expect(res.statusCode).toBe(401);
    });
  });

  describe('DELETE /api/favorites/:id', () => {
    let favoriteId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          label: 'To delete',
          origin: 'Trento',
          destination: 'Rovereto'
        });
      favoriteId = res.body.data.favorite._id;
    });

    it('should delete own favorite', async () => {
      const res = await request(app)
        .delete(`/api/favorites/${favoriteId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify it's gone
      const listRes = await request(app)
        .get('/api/favorites')
        .set('Authorization', `Bearer ${userToken}`);
      expect(listRes.body.count).toBe(0);
    });

    it('should not allow deleting another user favorite', async () => {
      const res = await request(app)
        .delete(`/api/favorites/${favoriteId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.statusCode).toBe(403);
    });

    it('should return 404 for non-existent favorite', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .delete(`/api/favorites/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(404);
    });
  });
});

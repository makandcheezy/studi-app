const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');

const TEST_DB = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/studi_test';

// helper — registers a user and returns tokens + userId
async function registerAndLogin(overrides = {}) {
  const body = {
    email: 'test@example.com',
    password: 'password123',
    displayName: 'Test User',
    ...overrides,
  };
  const res = await request(app).post('/api/auth/register').send(body);
  return {
    accessToken: res.body.data?.accessToken,
    refreshToken: res.body.data?.refreshToken,
    userId: res.body.data?.user?.id,
    res,
  };
}

beforeAll(async () => {
  await mongoose.connect(TEST_DB);
});

afterEach(async () => {
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
});

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------
describe('POST /api/auth/register', () => {
  it('201 — creates account and returns both tokens', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'alice@example.com',
      password: 'password123',
      displayName: 'Alice',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.email).toBe('alice@example.com');
    expect(res.body.data.user.role).toBe('student');
  });

  it('201 — response never exposes passwordHash or refreshTokenHash', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'alice@example.com',
      password: 'password123',
      displayName: 'Alice',
    });

    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.data.user.refreshTokenHash).toBeUndefined();
  });

  it('409 — duplicate email returns EMAIL_IN_USE', async () => {
    await registerAndLogin({ email: 'dup@example.com' });
    const res = await request(app).post('/api/auth/register').send({
      email: 'dup@example.com',
      password: 'password123',
      displayName: 'Dup',
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('EMAIL_IN_USE');
  });

  it('400 — missing email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      password: 'password123',
      displayName: 'Alice',
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('400 — invalid email format', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'not-an-email',
      password: 'password123',
      displayName: 'Alice',
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('400 — password shorter than 6 chars', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'alice@example.com',
      password: '12345',
      displayName: 'Alice',
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('400 — displayName too short', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'alice@example.com',
      password: 'password123',
      displayName: 'A',
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('400 — displayName too long', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'alice@example.com',
      password: 'password123',
      displayName: 'A'.repeat(31),
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('400 — missing displayName', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'alice@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await registerAndLogin({ email: 'login@example.com', password: 'password123' });
  });

  it('200 — valid credentials return both tokens', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  it('401 — wrong password returns INVALID_CREDENTIALS', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'wrongpassword',
    });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('401 — unknown email returns INVALID_CREDENTIALS (same code as wrong password)', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('400 — missing password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('400 — invalid email format', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'not-an-email',
      password: 'password123',
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ---------------------------------------------------------------------------
// POST /api/auth/refresh
// ---------------------------------------------------------------------------
describe('POST /api/auth/refresh', () => {
  it('200 — valid access token + refresh token returns new access token', async () => {
    const { accessToken, refreshToken } = await registerAndLogin();

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('401 — no Authorization header rejected by protect middleware', async () => {
    const { refreshToken } = await registerAndLogin();

    const res = await request(app).post('/api/auth/refresh').send({ refreshToken });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('400 — missing refreshToken in body', async () => {
    const { accessToken } = await registerAndLogin();

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('401 — tampered refresh token', async () => {
    const { accessToken } = await registerAndLogin();

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken: 'totally.invalid.token' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('401 — refresh token after logout', async () => {
    const { accessToken, refreshToken } = await registerAndLogin();

    // logout first
    await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);

    // now try to refresh
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });
});

// ---------------------------------------------------------------------------
// POST /api/auth/logout
// ---------------------------------------------------------------------------
describe('POST /api/auth/logout', () => {
  it('200 — valid token logs out and clears refreshTokenHash in DB', async () => {
    const { accessToken, userId } = await registerAndLogin();

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.message).toBe('Logged out successfully');

    const user = await User.findById(userId);
    expect(user.refreshTokenHash).toBeNull();
  });

  it('401 — no Authorization header', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

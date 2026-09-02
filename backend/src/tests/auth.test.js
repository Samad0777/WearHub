const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

// External services (Redis-backed sessions, email sending) are mocked so
// tests are fast, deterministic, and don't need a real Redis/SMTP server
// running. We only mock the boundary — the actual auth.service logic
// (hashing, validation, ApiError throwing) still runs for real.
jest.mock("../services/email.service", () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}));

const mockRedisStore = new Map();
jest.mock("../services/token.service", () => ({
  createSession: jest.fn(async (userId, refreshToken) => {
    mockRedisStore.set(`session:${refreshToken}`, userId);
  }),
  getSessionUserId: jest.fn(async (refreshToken) => mockRedisStore.get(`session:${refreshToken}`) || null),
  revokeSession: jest.fn(async (userId, refreshToken) => {
    mockRedisStore.delete(`session:${refreshToken}`);
  }),
  rotateSession: jest.fn(async (userId, oldToken, newToken) => {
    mockRedisStore.delete(`session:${oldToken}`);
    mockRedisStore.set(`session:${newToken}`, userId);
  }),
  revokeAllSessions: jest.fn(async () => {}),
  storeEmailVerificationToken: jest.fn(async (userId, hashedToken) => {
    mockRedisStore.set(`email_verify:${hashedToken}`, userId);
  }),
  consumeEmailVerificationToken: jest.fn(async (hashedToken) => {
    const userId = mockRedisStore.get(`email_verify:${hashedToken}`);
    mockRedisStore.delete(`email_verify:${hashedToken}`);
    return userId || null;
  }),
  storePasswordResetToken: jest.fn(async (userId, hashedToken) => {
    mockRedisStore.set(`password_reset:${hashedToken}`, userId);
  }),
  consumePasswordResetToken: jest.fn(async (hashedToken) => {
    const userId = mockRedisStore.get(`password_reset:${hashedToken}`);
    mockRedisStore.delete(`password_reset:${hashedToken}`);
    return userId || null;
  }),
}));

process.env.JWT_ACCESS_SECRET = "test_access_secret";
process.env.ACCESS_TOKEN_EXPIRY = "15m";
process.env.FRONTEND_URL = "http://localhost:5173";

const app = require("../app");
const User = require("../models/User");

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany({});
  mockRedisStore.clear();
  jest.clearAllMocks();
});

const validUser = { name: "Malik", email: "malik@example.com", password: "password123" };

describe("POST /api/v1/auth/register", () => {
  it("registers a new user and does not return the password", async () => {
    const res = await request(app).post("/api/v1/auth/register").send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(validUser.email);
    expect(res.body.data.password).toBeUndefined();
  });

  it("rejects duplicate email registration", async () => {
    await request(app).post("/api/v1/auth/register").send(validUser);
    const res = await request(app).post("/api/v1/auth/register").send(validUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...validUser, password: "short" });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/v1/auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/api/v1/auth/register").send(validUser);
  });

  it("logs in with correct credentials and sets a refresh cookie", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: validUser.email, password: validUser.password });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.headers["set-cookie"][0]).toMatch(/refreshToken=/);
  });

  it("rejects an incorrect password", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: validUser.email, password: "wrongpassword" });

    expect(res.status).toBe(401);
  });
});

describe("GET /api/v1/auth/me", () => {
  it("returns the current user when a valid access token is provided", async () => {
    await request(app).post("/api/v1/auth/register").send(validUser);
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: validUser.email, password: validUser.password });
    const { accessToken } = loginRes.body.data;

    const res = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(validUser.email);
  });

  it("rejects a request with no access token", async () => {
    const res = await request(app).get("/api/v1/auth/me");
    expect(res.status).toBe(401);
  });
});

describe("POST /api/v1/auth/refresh", () => {
  it("rotates the refresh token and issues a new access token", async () => {
    await request(app).post("/api/v1/auth/register").send(validUser);
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: validUser.email, password: validUser.password });
    const cookie = loginRes.headers["set-cookie"][0];

    const res = await request(app).post("/api/v1/auth/refresh").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    // The old refresh token must no longer work (rotation actually rotated it)
    const reuseRes = await request(app).post("/api/v1/auth/refresh").set("Cookie", cookie);
    expect(reuseRes.status).toBe(401);
  });

  it("rejects when no refresh cookie is present", async () => {
    const res = await request(app).post("/api/v1/auth/refresh");
    expect(res.status).toBe(401);
  });
});

describe("Authorization (RBAC)", () => {
  it("a customer cannot access an admin-only route", async () => {
    await request(app).post("/api/v1/auth/register").send(validUser);
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: validUser.email, password: validUser.password });
    const { accessToken } = loginRes.body.data;

    // There's no real admin route yet in Phase 2 — this test exercises the
    // authorize() middleware directly using a throwaway route mounted just
    // for this test file, since admin routes arrive in a later phase.
    const { authenticate, authorize } = require("../middlewares/auth.middleware");
    const express = require("express");
    const testApp = express();
    testApp.get("/admin-only", authenticate, authorize("admin"), (req, res) => res.json({ ok: true }));
    testApp.use(require("../middlewares/errorHandler"));

    const res = await request(testApp).get("/admin-only").set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(403);
  });
});

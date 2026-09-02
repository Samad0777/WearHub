const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

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
  revokeSession: jest.fn(async () => {}),
  rotateSession: jest.fn(async () => {}),
  revokeAllSessions: jest.fn(async () => {}),
  storeEmailVerificationToken: jest.fn(async () => {}),
  consumeEmailVerificationToken: jest.fn(async () => null),
  storePasswordResetToken: jest.fn(async () => {}),
  consumePasswordResetToken: jest.fn(async () => null),
}));

process.env.JWT_ACCESS_SECRET = "test_access_secret";
process.env.ACCESS_TOKEN_EXPIRY = "15m";
process.env.FRONTEND_URL = "http://localhost:5173";

const app = require("../app");
const User = require("../models/User");
const Category = require("../models/Category");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Review = require("../models/Review");
const Address = require("../models/Address");

let mongoServer;
let customerToken;
let adminToken;
let product;
let customerId;

async function registerAndLogin(email, role) {
  await request(app).post("/api/v1/auth/register").send({ name: "Test", email, password: "password123" });
  if (role === "admin") await User.updateOne({ email }, { role: "admin" });
  const res = await request(app).post("/api/v1/auth/login").send({ email, password: "password123" });
  return res.body.data.accessToken;
}

// Bypasses the full checkout/payment flow — directly inserts a "paid"
// order so review-eligibility tests don't need to re-exercise the whole
// payment pipeline already covered in payment.test.js.
async function createPaidOrderFor(userId, productObj, variantId) {
  const address = await Address.create({
    user: userId,
    fullName: "Test",
    phone: "9999999999",
    addressLine: "1 Test St",
    city: "Bengaluru",
    state: "Karnataka",
    postalCode: "560001",
    isDefault: true,
  });
  return Order.create({
    user: userId,
    items: [
      {
        product: productObj._id,
        variantId,
        name: productObj.name,
        sku: productObj.variants[0].sku,
        quantity: 1,
        unitPrice: productObj.variants[0].price,
      },
    ],
    shippingAddressSnapshot: {
      fullName: address.fullName,
      phone: address.phone,
      addressLine: address.addressLine,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
    },
    pricing: { subtotal: productObj.variants[0].price, discount: 0, total: productObj.variants[0].price },
    status: "confirmed",
    paymentStatus: "paid",
  });
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  customerToken = await registerAndLogin("customer@example.com", "customer");
  adminToken = await registerAndLogin("admin@example.com", "admin");
  customerId = (await User.findOne({ email: "customer@example.com" }))._id;

  const category = await Category.create({ name: "T-Shirts", slug: "t-shirts" });
  product = await Product.create({
    name: "Classic Tee",
    slug: "classic-tee",
    category: category._id,
    variants: [{ sku: "TS-BLK-M", price: 500, stock: 10 }],
  });
});

afterEach(async () => {
  await Promise.all(
    [User, Category, Product, Order, Review, Address].map((m) => m.deleteMany({}))
  );
  mockRedisStore.clear();
  jest.clearAllMocks();
});

describe("Reviews", () => {
  it("blocks a review from a user who hasn't purchased the product", async () => {
    const res = await request(app)
      .post(`/api/v1/reviews/product/${product._id}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ rating: 5, comment: "Great!" });

    expect(res.status).toBe(403);
  });

  it("allows a review from a user with a paid order for the product, and updates the product rating", async () => {
    await createPaidOrderFor(customerId, product, product.variants[0]._id);

    const res = await request(app)
      .post(`/api/v1/reviews/product/${product._id}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ rating: 4, comment: "Pretty good" });

    expect(res.status).toBe(201);

    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct.ratingAvg).toBe(4);
    expect(updatedProduct.ratingCount).toBe(1);
  });

  it("prevents a duplicate review from the same user on the same product", async () => {
    await createPaidOrderFor(customerId, product, product.variants[0]._id);
    await request(app)
      .post(`/api/v1/reviews/product/${product._id}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ rating: 4 });

    const res = await request(app)
      .post(`/api/v1/reviews/product/${product._id}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ rating: 2 });

    expect(res.status).toBe(409);
  });

  it("recalculates the product rating average after a review is deleted", async () => {
    await createPaidOrderFor(customerId, product, product.variants[0]._id);
    const createRes = await request(app)
      .post(`/api/v1/reviews/product/${product._id}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ rating: 4 });
    const reviewId = createRes.body.data._id;

    await request(app).delete(`/api/v1/reviews/${reviewId}`).set("Authorization", `Bearer ${customerToken}`);

    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct.ratingCount).toBe(0);
    expect(updatedProduct.ratingAvg).toBe(0);
  });

  it("rejects an out-of-range rating", async () => {
    const res = await request(app)
      .post(`/api/v1/reviews/product/${product._id}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ rating: 7 });

    expect(res.status).toBe(400);
  });
});

describe("Admin dashboard + customer management", () => {
  it("returns dashboard stats", async () => {
    await createPaidOrderFor(customerId, product, product.variants[0]._id);

    const res = await request(app).get("/api/v1/admin/dashboard").set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.totalOrders).toBe(1);
    expect(res.body.data.totalRevenue).toBe(500);
    expect(res.body.data.totalCustomers).toBe(1);
  });

  it("lists customers without leaking password hashes", async () => {
    const res = await request(app).get("/api/v1/admin/customers").set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].password).toBeUndefined();
  });

  it("blocks a non-admin from the dashboard", async () => {
    const res = await request(app).get("/api/v1/admin/dashboard").set("Authorization", `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
  });
});

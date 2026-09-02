const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryReplSet } = require("mongodb-memory-server");

// Order creation/cancellation use Mongo multi-document transactions
// (inventory.service.js), and transactions require a replica set — a
// standalone MongoMemoryServer won't support them, hence ReplSet here
// specifically for this test file.

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
const Cart = require("../models/Cart");
const Address = require("../models/Address");
const Coupon = require("../models/Coupon");
const Order = require("../models/Order");

let mongoServer;
let customerToken;
let adminToken;
let product;
let variantId;
let addressId;

async function registerAndLogin(email, role) {
  await request(app).post("/api/v1/auth/register").send({ name: "Test", email, password: "password123" });
  if (role === "admin") await User.updateOne({ email }, { role: "admin" });
  const res = await request(app).post("/api/v1/auth/login").send({ email, password: "password123" });
  return res.body.data.accessToken;
}

beforeAll(async () => {
  mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongoServer.getUri());
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  customerToken = await registerAndLogin("customer@example.com", "customer");
  adminToken = await registerAndLogin("admin@example.com", "admin");

  const category = await Category.create({ name: "T-Shirts", slug: "t-shirts" });
  product = await Product.create({
    name: "Classic Tee",
    slug: "classic-tee",
    category: category._id,
    images: [{ url: "https://ik.io/tee.jpg", fileId: "f1" }],
    variants: [{ sku: "TS-BLK-M", price: 500, stock: 3 }],
  });
  variantId = product.variants[0]._id.toString();

  const customer = await User.findOne({ email: "customer@example.com" });
  const address = await Address.create({
    user: customer._id,
    fullName: "Malik",
    phone: "9999999999",
    addressLine: "123 Main St",
    city: "Bengaluru",
    state: "Karnataka",
    postalCode: "560001",
    isDefault: true,
  });
  addressId = address._id.toString();

  await Cart.create({
    user: customer._id,
    items: [{ product: product._id, variantId, quantity: 2 }],
  });
});

afterEach(async () => {
  await Promise.all(
    [User, Category, Product, Cart, Address, Coupon, Order].map((Model) => Model.deleteMany({}))
  );
  mockRedisStore.clear();
  jest.clearAllMocks();
});

describe("POST /api/v1/orders — order creation", () => {
  it("creates an order with a correct authoritative total and does NOT deduct stock yet", async () => {
    const res = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ addressId });

    expect(res.status).toBe(201);
    expect(res.body.data.pricing.subtotal).toBe(1000); // 500 * 2
    expect(res.body.data.pricing.total).toBe(1000);
    expect(res.body.data.status).toBe("pending");
    expect(res.body.data.paymentStatus).toBe("pending");

    // Stock deduction now happens on PAYMENT confirmation (Phase 6), not
    // at order creation — see payment.test.js for that behavior.
    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct.variants[0].stock).toBe(3); // unchanged
  });

  it("snapshots item and address details onto the order", async () => {
    const res = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ addressId });

    expect(res.body.data.items[0]).toMatchObject({ name: "Classic Tee", sku: "TS-BLK-M", unitPrice: 500 });
    expect(res.body.data.shippingAddressSnapshot).toMatchObject({ city: "Bengaluru", postalCode: "560001" });
  });

  it("clears the cart after a successful order", async () => {
    await request(app).post("/api/v1/orders").set("Authorization", `Bearer ${customerToken}`).send({ addressId });

    const cartRes = await request(app).get("/api/v1/cart").set("Authorization", `Bearer ${customerToken}`);
    expect(cartRes.body.data.items).toHaveLength(0);
  });

  it("rejects an order when requested quantity exceeds stock", async () => {
    const customer = await User.findOne({ email: "customer@example.com" });
    await Cart.updateOne({ user: customer._id }, { items: [{ product: product._id, variantId, quantity: 10 }] });

    const res = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ addressId });

    expect(res.status).toBe(400);

    // Stock must remain untouched — the transaction should have rolled back.
    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct.variants[0].stock).toBe(3);
  });

  it("rejects checkout with an empty cart", async () => {
    const customer = await User.findOne({ email: "customer@example.com" });
    await Cart.updateOne({ user: customer._id }, { items: [] });

    const res = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ addressId });

    expect(res.status).toBe(400);
  });

  it("rejects an address that belongs to another user", async () => {
    const otherToken = await registerAndLogin("other@example.com", "customer");

    const res = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ addressId });

    expect(res.status).toBe(404);
  });
});

describe("Coupons applied at checkout", () => {
  it("applies a percentage discount correctly", async () => {
    await Coupon.create({
      code: "SAVE10",
      discountType: "percentage",
      discountValue: 10,
      expiresAt: new Date(Date.now() + 86400000),
    });

    const res = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ addressId, couponCode: "SAVE10" });

    expect(res.status).toBe(201);
    expect(res.body.data.pricing.discount).toBe(100); // 10% of 1000
    expect(res.body.data.pricing.total).toBe(900);
  });

  it("rejects an expired coupon", async () => {
    await Coupon.create({
      code: "OLD10",
      discountType: "flat",
      discountValue: 50,
      expiresAt: new Date(Date.now() - 86400000),
    });

    const res = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ addressId, couponCode: "OLD10" });

    expect(res.status).toBe(400);
  });

  it("rejects a coupon below its minimum order amount", async () => {
    await Coupon.create({
      code: "BIG500",
      discountType: "flat",
      discountValue: 100,
      minOrderAmount: 5000,
      expiresAt: new Date(Date.now() + 86400000),
    });

    const res = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ addressId, couponCode: "BIG500" });

    expect(res.status).toBe(400);
  });

  it("rejects an invalid coupon code", async () => {
    const res = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ addressId, couponCode: "DOESNOTEXIST" });

    expect(res.status).toBe(404);
  });
});

describe("Order cancellation", () => {
  it("cancels a pending (unpaid) order — no stock to restore since none was deducted", async () => {
    const createRes = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ addressId });
    const orderId = createRes.body.data._id;

    const cancelRes = await request(app)
      .post(`/api/v1/orders/${orderId}/cancel`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.status).toBe("cancelled");

    // Stock was never deducted for an unpaid order, so it stays at 3
    // throughout — cancellation is a no-op for inventory here.
    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct.variants[0].stock).toBe(3);

    // Cancelling again should be rejected (already cancelled).
    const secondCancel = await request(app)
      .post(`/api/v1/orders/${orderId}/cancel`)
      .set("Authorization", `Bearer ${customerToken}`);
    expect(secondCancel.status).toBe(400);
  });

  it("does not allow cancelling a delivered order", async () => {
    const createRes = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ addressId });
    const orderId = createRes.body.data._id;

    // Walk it through the valid admin transitions to "delivered".
    for (const status of ["confirmed", "processing", "shipped", "delivered"]) {
      await request(app)
        .patch(`/api/v1/orders/admin/${orderId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status });
    }

    const res = await request(app)
      .post(`/api/v1/orders/${orderId}/cancel`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(400);
  });

  it("a customer cannot cancel another customer's order", async () => {
    const createRes = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ addressId });
    const orderId = createRes.body.data._id;

    const otherToken = await registerAndLogin("other2@example.com", "customer");
    const res = await request(app)
      .post(`/api/v1/orders/${orderId}/cancel`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(404);
  });
});

describe("Admin order status transitions", () => {
  it("rejects an invalid status jump (pending -> shipped)", async () => {
    const createRes = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ addressId });
    const orderId = createRes.body.data._id;

    const res = await request(app)
      .patch(`/api/v1/orders/admin/${orderId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "shipped" });

    expect(res.status).toBe(400);
  });

  it("blocks a customer from using the admin status endpoint", async () => {
    const createRes = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ addressId });
    const orderId = createRes.body.data._id;

    const res = await request(app)
      .patch(`/api/v1/orders/admin/${orderId}/status`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ status: "confirmed" });

    expect(res.status).toBe(403);
  });
});

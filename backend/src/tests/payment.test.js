const request = require("supertest");
const mongoose = require("mongoose");
const crypto = require("crypto");
const { MongoMemoryReplSet } = require("mongodb-memory-server");

// Payments touch stock via inventory.service.js inside a transaction —
// same reason as order.test.js, this needs a replica set.

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

// Real Razorpay client would make an external HTTP call — mocked here so
// tests are deterministic and need no real Razorpay account.
let mockOrderCounter = 0;
jest.mock("../config/razorpay", () => ({
  orders: {
    create: jest.fn(async () => ({ id: `order_test_${++mockOrderCounter}` })),
  },
}));

process.env.JWT_ACCESS_SECRET = "test_access_secret";
process.env.ACCESS_TOKEN_EXPIRY = "15m";
process.env.FRONTEND_URL = "http://localhost:5173";
process.env.RAZORPAY_KEY_ID = "rzp_test_key";
process.env.RAZORPAY_KEY_SECRET = "test_key_secret";
process.env.RAZORPAY_WEBHOOK_SECRET = "test_webhook_secret";

const app = require("../app");
const User = require("../models/User");
const Category = require("../models/Category");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const Address = require("../models/Address");
const Order = require("../models/Order");
const Payment = require("../models/Payment");

let mongoServer;
let customerToken;
let product;
let variantId;
let addressId;
let orderId;

function signVerification(razorpayOrderId, razorpayPaymentId) {
  return crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");
}

function signWebhookBody(bodyString) {
  return crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET).update(bodyString).digest("hex");
}

async function registerAndLogin(email) {
  await request(app).post("/api/v1/auth/register").send({ name: "Test", email, password: "password123" });
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
  customerToken = await registerAndLogin("customer@example.com");

  const category = await Category.create({ name: "T-Shirts", slug: "t-shirts" });
  product = await Product.create({
    name: "Classic Tee",
    slug: "classic-tee",
    category: category._id,
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

  await Cart.create({ user: customer._id, items: [{ product: product._id, variantId, quantity: 2 }] });

  const orderRes = await request(app)
    .post("/api/v1/orders")
    .set("Authorization", `Bearer ${customerToken}`)
    .send({ addressId });
  orderId = orderRes.body.data._id;
});

afterEach(async () => {
  await Promise.all([User, Category, Product, Cart, Address, Order, Payment].map((m) => m.deleteMany({})));
  mockRedisStore.clear();
  jest.clearAllMocks();
  mockOrderCounter = 0;
});

describe("POST /api/v1/payments/orders/:orderId", () => {
  it("creates a Razorpay order for a pending order", async () => {
    const res = await request(app)
      .post(`/api/v1/payments/orders/${orderId}`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.razorpayOrderId).toMatch(/^order_test_/);
    expect(res.body.data.amount).toBe(1000);
    expect(res.body.data.keyId).toBe("rzp_test_key");
  });

  it("reuses an existing unverified payment instead of creating a duplicate Razorpay order", async () => {
    const first = await request(app)
      .post(`/api/v1/payments/orders/${orderId}`)
      .set("Authorization", `Bearer ${customerToken}`);
    const second = await request(app)
      .post(`/api/v1/payments/orders/${orderId}`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(first.body.data.razorpayOrderId).toBe(second.body.data.razorpayOrderId);

    const paymentCount = await Payment.countDocuments({ order: orderId });
    expect(paymentCount).toBe(1);
  });
});

describe("POST /api/v1/payments/verify", () => {
  it("verifies a valid signature, marks the order paid, and deducts stock", async () => {
    const createRes = await request(app)
      .post(`/api/v1/payments/orders/${orderId}`)
      .set("Authorization", `Bearer ${customerToken}`);
    const { razorpayOrderId } = createRes.body.data;
    const razorpayPaymentId = "pay_test_123";
    const razorpaySignature = signVerification(razorpayOrderId, razorpayPaymentId);

    const res = await request(app)
      .post("/api/v1/payments/verify")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ razorpayOrderId, razorpayPaymentId, razorpaySignature });

    expect(res.status).toBe(200);

    const order = await Order.findById(orderId);
    expect(order.status).toBe("confirmed");
    expect(order.paymentStatus).toBe("paid");

    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct.variants[0].stock).toBe(1); // 3 - 2, deducted only now
  });

  it("rejects an invalid signature and marks the payment failed", async () => {
    const createRes = await request(app)
      .post(`/api/v1/payments/orders/${orderId}`)
      .set("Authorization", `Bearer ${customerToken}`);
    const { razorpayOrderId } = createRes.body.data;

    const res = await request(app)
      .post("/api/v1/payments/verify")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ razorpayOrderId, razorpayPaymentId: "pay_fake", razorpaySignature: "not_a_real_signature" });

    expect(res.status).toBe(400);

    const payment = await Payment.findOne({ razorpayOrderId });
    expect(payment.status).toBe("failed");

    // Stock must remain untouched on a failed verification.
    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct.variants[0].stock).toBe(3);
  });

  it("is idempotent — verifying the same payment twice only deducts stock once", async () => {
    const createRes = await request(app)
      .post(`/api/v1/payments/orders/${orderId}`)
      .set("Authorization", `Bearer ${customerToken}`);
    const { razorpayOrderId } = createRes.body.data;
    const razorpayPaymentId = "pay_test_456";
    const razorpaySignature = signVerification(razorpayOrderId, razorpayPaymentId);

    await request(app)
      .post("/api/v1/payments/verify")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ razorpayOrderId, razorpayPaymentId, razorpaySignature });

    const secondRes = await request(app)
      .post("/api/v1/payments/verify")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ razorpayOrderId, razorpayPaymentId, razorpaySignature });

    expect(secondRes.status).toBe(200); // idempotent no-op, not an error

    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct.variants[0].stock).toBe(1); // still 3 - 2, not deducted twice
  });
});

describe("POST /api/v1/payments/webhook", () => {
  it("processes a valid payment.captured webhook and confirms the order", async () => {
    const createRes = await request(app)
      .post(`/api/v1/payments/orders/${orderId}`)
      .set("Authorization", `Bearer ${customerToken}`);
    const { razorpayOrderId } = createRes.body.data;

    const webhookBody = {
      event: "payment.captured",
      payload: { payment: { entity: { id: "pay_webhook_1", order_id: razorpayOrderId } } },
    };
    const bodyString = JSON.stringify(webhookBody);
    const signature = signWebhookBody(bodyString);

    const res = await request(app)
      .post("/api/v1/payments/webhook")
      .set("x-razorpay-signature", signature)
      .set("Content-Type", "application/json")
      .send(bodyString);

    expect(res.status).toBe(200);

    const order = await Order.findById(orderId);
    expect(order.paymentStatus).toBe("paid");
  });

  it("rejects a webhook with an invalid signature", async () => {
    const createRes = await request(app)
      .post(`/api/v1/payments/orders/${orderId}`)
      .set("Authorization", `Bearer ${customerToken}`);
    const { razorpayOrderId } = createRes.body.data;

    const webhookBody = {
      event: "payment.captured",
      payload: { payment: { entity: { id: "pay_webhook_2", order_id: razorpayOrderId } } },
    };

    const res = await request(app)
      .post("/api/v1/payments/webhook")
      .set("x-razorpay-signature", "totally_wrong_signature")
      .set("Content-Type", "application/json")
      .send(JSON.stringify(webhookBody));

    expect(res.status).toBe(400);

    const order = await Order.findById(orderId);
    expect(order.paymentStatus).toBe("pending"); // unaffected
  });

  it("is idempotent — a duplicate webhook delivery does not double-deduct stock", async () => {
    const createRes = await request(app)
      .post(`/api/v1/payments/orders/${orderId}`)
      .set("Authorization", `Bearer ${customerToken}`);
    const { razorpayOrderId } = createRes.body.data;

    const webhookBody = {
      event: "payment.captured",
      payload: { payment: { entity: { id: "pay_webhook_3", order_id: razorpayOrderId } } },
    };
    const bodyString = JSON.stringify(webhookBody);
    const signature = signWebhookBody(bodyString);

    // Simulate Razorpay delivering the same event twice.
    await request(app)
      .post("/api/v1/payments/webhook")
      .set("x-razorpay-signature", signature)
      .set("Content-Type", "application/json")
      .send(bodyString);
    await request(app)
      .post("/api/v1/payments/webhook")
      .set("x-razorpay-signature", signature)
      .set("Content-Type", "application/json")
      .send(bodyString);

    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct.variants[0].stock).toBe(1); // 3 - 2, only once
  });
});

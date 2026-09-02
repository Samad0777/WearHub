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
const Cart = require("../models/Cart");
const Wishlist = require("../models/Wishlist");
const Address = require("../models/Address");

let mongoServer;
let customerToken;
let product;
let variantId;

async function registerAndLogin(email) {
  await request(app).post("/api/v1/auth/register").send({ name: "Test", email, password: "password123" });
  const res = await request(app).post("/api/v1/auth/login").send({ email, password: "password123" });
  return res.body.data.accessToken;
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
  customerToken = await registerAndLogin("customer@example.com");
  const category = await Category.create({ name: "T-Shirts", slug: "t-shirts" });
  product = await Product.create({
    name: "Classic Tee",
    slug: "classic-tee",
    category: category._id,
    variants: [{ sku: "TS-BLK-M", price: 999, stock: 5 }],
  });
  variantId = product.variants[0]._id.toString();
});

afterEach(async () => {
  await User.deleteMany({});
  await Category.deleteMany({});
  await Product.deleteMany({});
  await Cart.deleteMany({});
  await Wishlist.deleteMany({});
  await Address.deleteMany({});
  mockRedisStore.clear();
  jest.clearAllMocks();
});

describe("Cart", () => {
  it("adds an item and returns an authoritative computed total", async () => {
    const res = await request(app)
      .post("/api/v1/cart/items")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ productId: product._id.toString(), variantId, quantity: 2 });

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].unitPrice).toBe(999);
    expect(res.body.data.subtotal).toBe(1998);
  });

  it("merges quantity when the same product+variant is added twice", async () => {
    await request(app)
      .post("/api/v1/cart/items")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ productId: product._id.toString(), variantId, quantity: 2 });

    const res = await request(app)
      .post("/api/v1/cart/items")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ productId: product._id.toString(), variantId, quantity: 1 });

    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].quantity).toBe(3);
  });

  it("rejects adding more than available stock", async () => {
    const res = await request(app)
      .post("/api/v1/cart/items")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ productId: product._id.toString(), variantId, quantity: 999 });

    expect(res.status).toBe(400);
  });

  it("updates item quantity", async () => {
    const addRes = await request(app)
      .post("/api/v1/cart/items")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ productId: product._id.toString(), variantId, quantity: 1 });
    const itemId = addRes.body.data.items[0].itemId;

    const res = await request(app)
      .patch(`/api/v1/cart/items/${itemId}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ quantity: 3 });

    expect(res.status).toBe(200);
    expect(res.body.data.items[0].quantity).toBe(3);
    expect(res.body.data.subtotal).toBe(2997);
  });

  it("removes an item from the cart", async () => {
    const addRes = await request(app)
      .post("/api/v1/cart/items")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ productId: product._id.toString(), variantId, quantity: 1 });
    const itemId = addRes.body.data.items[0].itemId;

    const res = await request(app)
      .delete(`/api/v1/cart/items/${itemId}`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(0);
  });

  it("requires authentication", async () => {
    const res = await request(app).get("/api/v1/cart");
    expect(res.status).toBe(401);
  });
});

describe("Wishlist", () => {
  it("adds a product and prevents duplicates", async () => {
    const first = await request(app)
      .post("/api/v1/wishlist/items")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ productId: product._id.toString() });
    expect(first.status).toBe(200);

    const duplicate = await request(app)
      .post("/api/v1/wishlist/items")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ productId: product._id.toString() });
    expect(duplicate.status).toBe(409);
  });

  it("removes a product from the wishlist", async () => {
    await request(app)
      .post("/api/v1/wishlist/items")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ productId: product._id.toString() });

    const res = await request(app)
      .delete(`/api/v1/wishlist/items/${product._id.toString()}`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(0);
  });
});

describe("Addresses", () => {
  const validAddress = {
    fullName: "Malik",
    phone: "9999999999",
    addressLine: "123 Main St",
    city: "Bengaluru",
    state: "Karnataka",
    postalCode: "560001",
  };

  it("makes the first address the default automatically", async () => {
    const res = await request(app)
      .post("/api/v1/addresses")
      .set("Authorization", `Bearer ${customerToken}`)
      .send(validAddress);

    expect(res.status).toBe(201);
    expect(res.body.data.isDefault).toBe(true);
  });

  it("only one address is default at a time", async () => {
    await request(app).post("/api/v1/addresses").set("Authorization", `Bearer ${customerToken}`).send(validAddress);
    const secondRes = await request(app)
      .post("/api/v1/addresses")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ ...validAddress, addressLine: "456 Second St", isDefault: true });

    const listRes = await request(app).get("/api/v1/addresses").set("Authorization", `Bearer ${customerToken}`);
    const defaults = listRes.body.data.filter((a) => a.isDefault);

    expect(defaults).toHaveLength(1);
    expect(defaults[0]._id).toBe(secondRes.body.data._id);
  });

  it("a user cannot access another user's address", async () => {
    const otherToken = await registerAndLogin("other@example.com");
    const createRes = await request(app)
      .post("/api/v1/addresses")
      .set("Authorization", `Bearer ${customerToken}`)
      .send(validAddress);
    const addressId = createRes.body.data._id;

    const res = await request(app)
      .patch(`/api/v1/addresses/${addressId}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ city: "Mumbai" });

    expect(res.status).toBe(404);
  });
});

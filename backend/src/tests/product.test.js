const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

jest.mock("../services/email.service", () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../services/imagekit.service", () => ({
  uploadProductImage: jest.fn().mockResolvedValue({ url: "https://ik.io/fake.jpg", fileId: "fake_file_id" }),
  deleteProductImage: jest.fn().mockResolvedValue(undefined),
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

let mongoServer;
let adminToken;
let customerToken;
let categoryId;

async function registerAndLogin(role) {
  const email = `${role}@example.com`;
  await request(app).post("/api/v1/auth/register").send({ name: role, email, password: "password123" });
  if (role === "admin") {
    await User.updateOne({ email }, { role: "admin" });
  }
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
  adminToken = await registerAndLogin("admin");
  customerToken = await registerAndLogin("customer");
  const category = await Category.create({ name: "T-Shirts", slug: "t-shirts" });
  categoryId = category._id.toString();
});

afterEach(async () => {
  await User.deleteMany({});
  await Category.deleteMany({});
  await Product.deleteMany({});
  mockRedisStore.clear();
  jest.clearAllMocks();
});

const validProductPayload = () => ({
  name: "Classic Tee",
  description: "A classic cotton t-shirt",
  category: categoryId,
  variants: [
    { sku: "TS-BLK-M", attributes: { color: "Black", size: "M" }, price: 999, stock: 15 },
    { sku: "TS-BLK-L", attributes: { color: "Black", size: "L" }, price: 999, stock: 5 },
  ],
});

describe("POST /api/v1/categories", () => {
  it("allows an admin to create a category", async () => {
    const res = await request(app)
      .post("/api/v1/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Shoes" });

    expect(res.status).toBe(201);
    expect(res.body.data.slug).toBe("shoes");
  });

  it("blocks a customer from creating a category", async () => {
    const res = await request(app)
      .post("/api/v1/categories")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ name: "Shoes" });

    expect(res.status).toBe(403);
  });
});

describe("POST /api/v1/products", () => {
  it("allows an admin to create a product with variants", async () => {
    const res = await request(app)
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(validProductPayload());

    expect(res.status).toBe(201);
    expect(res.body.data.variants).toHaveLength(2);
    expect(res.body.data.slug).toBe("classic-tee");
  });

  it("rejects a product with a duplicate SKU", async () => {
    await request(app).post("/api/v1/products").set("Authorization", `Bearer ${adminToken}`).send(validProductPayload());

    const res = await request(app)
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ ...validProductPayload(), name: "Another Tee" });

    expect(res.status).toBe(409);
  });

  it("rejects a product with no variants", async () => {
    const res = await request(app)
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ ...validProductPayload(), variants: [] });

    expect(res.status).toBe(400);
  });

  it("blocks a customer from creating a product", async () => {
    const res = await request(app)
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${customerToken}`)
      .send(validProductPayload());

    expect(res.status).toBe(403);
  });
});

describe("GET /api/v1/products", () => {
  beforeEach(async () => {
    await Product.create({
      name: "Cheap Tee",
      slug: "cheap-tee",
      category: categoryId,
      variants: [{ sku: "CHEAP-1", price: 199, stock: 10 }],
    });
    await Product.create({
      name: "Premium Tee",
      slug: "premium-tee",
      category: categoryId,
      variants: [{ sku: "PREMIUM-1", price: 1999, stock: 10 }],
    });
  });

  it("returns paginated results with metadata", async () => {
    const res = await request(app).get("/api/v1/products?limit=1&page=1");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination).toMatchObject({ page: 1, limit: 1, total: 2, totalPages: 2 });
  });

  it("filters by minPrice/maxPrice", async () => {
    const res = await request(app).get("/api/v1/products?minPrice=1000");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe("Premium Tee");
  });

  it("rejects an out-of-range limit", async () => {
    const res = await request(app).get("/api/v1/products?limit=500");
    expect(res.status).toBe(400);
  });
});

describe("POST /api/v1/products/:id/images", () => {
  it("uploads an image via the mocked ImageKit service", async () => {
    const createRes = await request(app)
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(validProductPayload());
    const productId = createRes.body.data._id;

    const res = await request(app)
      .post(`/api/v1/products/${productId}/images`)
      .set("Authorization", `Bearer ${adminToken}`)
      .attach("image", Buffer.from("fake-image-bytes"), "shirt.jpg");

    expect(res.status).toBe(200);
    expect(res.body.data.images).toHaveLength(1);
    expect(res.body.data.images[0].url).toBe("https://ik.io/fake.jpg");
  });
});

const Redis = require("ioredis");

// Single shared Redis client used across the app for:
//   - refresh-token sessions (auth phase)
//   - rate limiting
//   - short-lived tokens (email verification, password reset)
const redisClient = new Redis(process.env.REDIS_URL);

redisClient.on("connect", () => {
  console.log("Redis connected");
});

redisClient.on("error", (err) => {
  console.error("Redis error:", err.message);
});

module.exports = redisClient;

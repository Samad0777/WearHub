require("dotenv").config();

const dns = require("dns");
const app = require("./app");
const connectDB = require("./config/db");
require("./config/redis"); // connects as soon as this module is imported

const PORT = process.env.PORT || 5000;
dns.setServers(["1.1.1.1", "8.8.8.8"]);

async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  });
}

startServer();

// Catch programming errors that slip through (e.g. a bug in an event
// handler outside the Express request cycle) so we log them instead of
// the process silently dying with no explanation.
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err);
  process.exit(1);
});

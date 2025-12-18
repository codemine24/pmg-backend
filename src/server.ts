import http from "http";
import app from "./app";
import config from "./app/config";

const port = config.port || 9000;

const server = http.createServer(app);

async function main() {
  try {
    // start server
    server.listen(port, () => {
      console.log(`${config.app_name} server is running on port ${port}`);
    });
  } catch (error) {
    console.log(error);
  }
}

// handle unhandledRejection
process.on("unhandledRejection", () => {
  console.log("Unhandled rejection is detected. shutting down...");
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
  process.exit(1);
});

// handle uncaught expception
process.on("uncaughtException", () => {
  console.log("Uncaught exception is detected. shutting down...");
  process.exit(1);
});

main();

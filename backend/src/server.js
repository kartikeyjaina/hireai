import dotenv from "dotenv";
import app from "./app.js";
import { connectMongo } from "./config/mongo.js";
import { connectRedis } from "./config/redis.js";

dotenv.config();

const port = Number(process.env.BACKEND_PORT || 4000);

async function bootstrap() {
  await connectMongo();
  await connectRedis();

  app.listen(port, () => {
    console.log(`HireAI API listening on port ${port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start HireAI API", error);
  process.exit(1);
});
